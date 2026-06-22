import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { generatePnr } from '../lib/pnr';
import * as tripService from '../services/tripService';

export type BlockCategory = 'Accommodation' | 'Transportation' | 'Food' | 'Activity';
export type MealType = 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Afternoon Snack' | 'Dinner';

export interface ItineraryBlock {
    id: string;
    dayId: string; // Target date in 'YYYY-MM-DD' format
    type: BlockCategory;
    title: string;
    details: string;
    costInBaseCurrency: number;
    startTime?: string;
    endTime?: string;
    order: number;

    checkoutDate?: string;
    mealType?: MealType;
    address?: string;
    googleMapsUrl?: string;
    phoneNumber?: string;
    websiteUrl?: string;
}

export interface TripConfig {
    name: string;
    startDate: string; // 'YYYY-MM-DD'
    endDate: string; // 'YYYY-MM-DD'
    exchangeRate: number; // e.g., 1 USD to 150 JPY
}

export interface ReturnFlightDetails {
    date: string;
    airline: string;
    flightNumber: string;
    departureAirport: string;
    departureTime: string;
    arrivalAirport: string;
    arrivalTime: string;
    seat: string;
    isOvernight?: boolean;
}

export interface Flight {
    id: string;
    confirmationCode: string;
    date: string;
    airline: string;
    flightNumber: string;
    departureAirport: string;
    departureTime: string;
    arrivalAirport: string;
    arrivalTime: string;
    seat: string;
    isReturn?: boolean;
    isOvernight?: boolean;
    returnFlight?: ReturnFlightDetails;
}

// ============================================
// localStorage helpers — only for remembering the last PNR
// ============================================

const LAST_PNR_KEY = 'nipongo-last-pnr';

export function getLastPnr(): string | null {
    try {
        return localStorage.getItem(LAST_PNR_KEY);
    } catch {
        return null;
    }
}

function saveLastPnr(pnr: string) {
    try {
        localStorage.setItem(LAST_PNR_KEY, pnr);
    } catch {
        // Silently ignore — localStorage may be unavailable
    }
}

function clearLastPnr() {
    try {
        localStorage.removeItem(LAST_PNR_KEY);
    } catch {
        // Silently ignore
    }
}

// ============================================
// Store Interface
// ============================================

interface TripState {
    // Connection state
    currentPnr: string | null;
    tripId: string | null;
    isLoading: boolean;
    connectionError: string | null;

    // Trip data
    config: TripConfig | null;
    blocks: ItineraryBlock[];
    flights: Flight[];

    // Trip lifecycle
    createTrip: (config: TripConfig) => Promise<void>;
    loadTrip: (pnr: string) => Promise<void>;
    leaveTrip: () => void;
    clearError: () => void;

    // Config
    setConfig: (config: TripConfig) => void;

    // Block actions (optimistic + async Supabase write)
    addBlock: (block: Omit<ItineraryBlock, 'id'>) => void;
    updateBlock: (id: string, updates: Partial<ItineraryBlock>) => void;
    deleteBlock: (id: string) => void;
    setBlocks: (blocks: ItineraryBlock[]) => void;

    // Flight actions (optimistic + async Supabase write)
    addFlight: (flight: Omit<Flight, 'id'>) => void;
    updateFlight: (id: string, updates: Partial<Flight>) => void;
    deleteFlight: (id: string) => void;

    // Real-time sync — used by useRealtimeSync to apply remote changes
    // without triggering a write-back to Supabase
    _applyRemoteBlockInsert: (block: ItineraryBlock) => void;
    _applyRemoteBlockUpdate: (id: string, updates: Partial<ItineraryBlock>) => void;
    _applyRemoteBlockDelete: (id: string) => void;
    _applyRemoteFlightInsert: (flight: Flight) => void;
    _applyRemoteFlightUpdate: (id: string, updates: Partial<Flight>) => void;
    _applyRemoteFlightDelete: (id: string) => void;
    _applyRemoteConfigUpdate: (config: TripConfig) => void;
}

// ============================================
// Recently-written IDs — used to ignore "echo" real-time events
// ============================================

const _recentlyWrittenIds = new Set<string>();

export function markAsRecentlyWritten(id: string) {
    _recentlyWrittenIds.add(id);
    setTimeout(() => _recentlyWrittenIds.delete(id), 3000);
}

export function wasRecentlyWritten(id: string): boolean {
    return _recentlyWrittenIds.has(id);
}

// ============================================
// Store
// ============================================

export const useTripStore = create<TripState>()((set, get) => ({
    // Initial state
    currentPnr: null,
    tripId: null,
    isLoading: false,
    connectionError: null,
    config: null,
    blocks: [],
    flights: [],

    // ---- Trip Lifecycle ----

    createTrip: async (config) => {
        set({ isLoading: true, connectionError: null });
        try {
            const pnr = await generatePnr();
            const result = await tripService.createTrip(config, pnr);
            saveLastPnr(pnr);
            set({
                tripId: result.id,
                currentPnr: pnr,
                config: result.config,
                blocks: [],
                flights: [],
                isLoading: false,
            });
        } catch (err) {
            set({
                isLoading: false,
                connectionError: `Failed to create trip: ${err instanceof Error ? err.message : 'Unknown error'}`,
            });
        }
    },

    loadTrip: async (pnr) => {
        set({ isLoading: true, connectionError: null });
        try {
            const result = await tripService.fetchTripByPnr(pnr);
            if (!result) {
                set({
                    isLoading: false,
                    connectionError: `No trip found with code "${pnr}". Please check the code and try again.`,
                });
                return;
            }
            saveLastPnr(pnr);
            set({
                tripId: result.tripId,
                currentPnr: result.pnrCode,
                config: result.config,
                blocks: result.blocks,
                flights: result.flights,
                isLoading: false,
            });
        } catch (err) {
            set({
                isLoading: false,
                connectionError: `Failed to load trip: ${err instanceof Error ? err.message : 'Unknown error'}`,
            });
        }
    },

    leaveTrip: () => {
        clearLastPnr();
        set({
            tripId: null,
            currentPnr: null,
            config: null,
            blocks: [],
            flights: [],
            connectionError: null,
        });
    },

    clearError: () => set({ connectionError: null }),

    // ---- Config ----

    setConfig: (config) => {
        const { tripId, currentPnr } = get();

        if (!tripId || !currentPnr) {
            // No trip loaded yet — this means we're creating a new trip
            get().createTrip(config);
            return;
        }

        // Optimistic update
        set({ config });

        // Async Supabase write
        tripService.updateTripConfig(tripId, config).then(() => {
            markAsRecentlyWritten(tripId);
        }).catch((err) => {
            set({
                connectionError: `Failed to save config: ${err instanceof Error ? err.message : 'Unknown error'}`,
            });
        });
    },

    // ---- Blocks ----

    addBlock: (blockData) => {
        const { tripId } = get();
        if (!tripId) return;

        // Optimistic: add with temp ID
        const tempId = uuidv4();
        const newBlock: ItineraryBlock = { ...blockData, id: tempId };
        set((state) => ({ blocks: [...state.blocks, newBlock] }));

        // Async Supabase write
        tripService.addBlock(tripId, blockData).then((savedBlock) => {
            // Replace temp ID with Supabase-generated ID
            set((state) => ({
                blocks: state.blocks.map((b) =>
                    b.id === tempId ? { ...b, id: savedBlock.id } : b
                ),
            }));
            markAsRecentlyWritten(savedBlock.id);
        }).catch((err) => {
            // Revert
            set((state) => ({
                blocks: state.blocks.filter((b) => b.id !== tempId),
                connectionError: `Failed to add block: ${err instanceof Error ? err.message : 'Unknown error'}`,
            }));
        });
    },

    updateBlock: (id, updates) => {
        // Optimistic update
        set((state) => ({
            blocks: state.blocks.map((block) =>
                block.id === id ? { ...block, ...updates } : block
            ),
        }));

        // Async Supabase write
        markAsRecentlyWritten(id);
        tripService.updateBlock(id, updates).catch((err) => {
            set({
                connectionError: `Failed to update block: ${err instanceof Error ? err.message : 'Unknown error'}`,
            });
        });
    },

    deleteBlock: (id) => {
        // Save for potential revert
        const deletedBlock = get().blocks.find((b) => b.id === id);
        if (!deletedBlock) return;

        // Optimistic delete
        set((state) => ({
            blocks: state.blocks.filter((block) => block.id !== id),
        }));

        // Async Supabase write
        markAsRecentlyWritten(id);
        tripService.deleteBlock(id).catch((err) => {
            // Revert
            set((state) => ({
                blocks: [...state.blocks, deletedBlock],
                connectionError: `Failed to delete block: ${err instanceof Error ? err.message : 'Unknown error'}`,
            }));
        });
    },

    setBlocks: (blocks) => {
        const { tripId } = get();

        // Optimistic update
        set({ blocks });

        // Async Supabase write — sync all changed blocks
        if (tripId) {
            // Mark all block IDs as recently written to suppress echo
            blocks.forEach((b) => markAsRecentlyWritten(b.id));
            tripService.syncBlocks(tripId, blocks).catch((err) => {
                set({
                    connectionError: `Failed to sync blocks: ${err instanceof Error ? err.message : 'Unknown error'}`,
                });
            });
        }
    },

    // ---- Flights ----

    addFlight: (flightData) => {
        const { tripId } = get();
        if (!tripId) return;

        const tempId = uuidv4();
        const newFlight: Flight = { ...flightData, id: tempId };
        set((state) => ({
            flights: [...state.flights, newFlight],
        }));

        tripService.addFlight(tripId, flightData).then((savedFlight) => {
            set((state) => ({
                flights: state.flights.map((f) =>
                    f.id === tempId ? { ...f, id: savedFlight.id } : f
                ),
            }));
            markAsRecentlyWritten(savedFlight.id);
        }).catch((err) => {
            set((state) => ({
                flights: state.flights.filter((f) => f.id !== tempId),
                connectionError: `Failed to add flight: ${err instanceof Error ? err.message : 'Unknown error'}`,
            }));
        });
    },

    updateFlight: (id, updates) => {
        set((state) => ({
            flights: state.flights.map((flight) =>
                flight.id === id ? { ...flight, ...updates } : flight
            ),
        }));

        markAsRecentlyWritten(id);
        tripService.updateFlight(id, updates).catch((err) => {
            set({
                connectionError: `Failed to update flight: ${err instanceof Error ? err.message : 'Unknown error'}`,
            });
        });
    },

    deleteFlight: (id) => {
        const deletedFlight = get().flights.find((f) => f.id === id);
        if (!deletedFlight) return;

        set((state) => ({
            flights: state.flights.filter((flight) => flight.id !== id),
        }));

        markAsRecentlyWritten(id);
        tripService.deleteFlight(id).catch((err) => {
            set((state) => ({
                flights: [...state.flights, deletedFlight],
                connectionError: `Failed to delete flight: ${err instanceof Error ? err.message : 'Unknown error'}`,
            }));
        });
    },

    // ---- Remote sync helpers (called by useRealtimeSync) ----

    _applyRemoteBlockInsert: (block) => {
        set((state) => {
            // Don't add if already exists (echo protection)
            if (state.blocks.some((b) => b.id === block.id)) return state;
            return { blocks: [...state.blocks, block] };
        });
    },

    _applyRemoteBlockUpdate: (id, updates) => {
        set((state) => ({
            blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        }));
    },

    _applyRemoteBlockDelete: (id) => {
        set((state) => ({
            blocks: state.blocks.filter((b) => b.id !== id),
        }));
    },

    _applyRemoteFlightInsert: (flight) => {
        set((state) => {
            if (state.flights.some((f) => f.id === flight.id)) return state;
            return { flights: [...state.flights, flight] };
        });
    },

    _applyRemoteFlightUpdate: (id, updates) => {
        set((state) => ({
            flights: state.flights.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        }));
    },

    _applyRemoteFlightDelete: (id) => {
        set((state) => ({
            flights: state.flights.filter((f) => f.id !== id),
        }));
    },

    _applyRemoteConfigUpdate: (config) => {
        set({ config });
    },
}));

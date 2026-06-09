import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

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

interface TripState {
    config: TripConfig | null;
    blocks: ItineraryBlock[];
    flights: Flight[];
    setConfig: (config: TripConfig) => void;
    addBlock: (block: Omit<ItineraryBlock, 'id'>) => void;
    updateBlock: (id: string, updates: Partial<ItineraryBlock>) => void;
    deleteBlock: (id: string) => void;
    setBlocks: (blocks: ItineraryBlock[]) => void;
    reorderBlocksInDay: (dayId: string, newOrderIds: string[]) => void;
    addFlight: (flight: Omit<Flight, 'id'>) => void;
    updateFlight: (id: string, updates: Partial<Flight>) => void;
    deleteFlight: (id: string) => void;
}

export const useTripStore = create<TripState>()(
    persist(
        (set) => ({
            config: null,
            blocks: [],
            flights: [],

            setConfig: (config) => set({ config }),

            addBlock: (blockData) =>
                set((state) => ({
                    blocks: [...state.blocks, { ...blockData, id: uuidv4() }],
                })),

            updateBlock: (id, updates) =>
                set((state) => ({
                    blocks: state.blocks.map((block) =>
                        block.id === id ? { ...block, ...updates } : block
                    ),
                })),

            deleteBlock: (id) =>
                set((state) => ({
                    blocks: state.blocks.filter((block) => block.id !== id),
                })),

            setBlocks: (blocks) => set({ blocks }),

            reorderBlocksInDay: (dayId, newOrderIds) =>
                set((state) => {
                    const otherBlocks = state.blocks.filter((b) => b.dayId !== dayId);
                    const dayBlocks = state.blocks.filter((b) => b.dayId === dayId);

                    // Sort dayBlocks based on newOrderIds
                    const reorderedDayBlocks = newOrderIds
                        .map((id) => dayBlocks.find((b) => b.id === id))
                        .filter((b): b is ItineraryBlock => b !== undefined)
                        .map((b, index) => ({ ...b, order: index }));

                    return { blocks: [...otherBlocks, ...reorderedDayBlocks] };
                }),
                
            addFlight: (flightData) =>
                set((state) => ({
                    flights: [...(state.flights || []), { ...flightData, id: uuidv4() }],
                })),

            updateFlight: (id, updates) =>
                set((state) => ({
                    flights: (state.flights || []).map((flight) =>
                        flight.id === id ? { ...flight, ...updates } : flight
                    ),
                })),

            deleteFlight: (id) =>
                set((state) => ({
                    flights: (state.flights || []).filter((flight) => flight.id !== id),
                })),
        }),
        {
            name: 'trip-planner-storage', // name of the item in the storage (must be unique)
        }
    )
);

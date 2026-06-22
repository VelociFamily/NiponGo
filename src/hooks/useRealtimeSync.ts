import { useEffect, useRef } from 'react';
import supabase from '../lib/supabase';
import { useTripStore, wasRecentlyWritten } from '../store/useTripStore';
import type { ItineraryBlock, Flight, TripConfig, ReturnFlightDetails } from '../store/useTripStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// DB → App mappers (matching tripService.ts)
// ============================================

interface DbBlock {
    id: string;
    trip_id: string;
    day_id: string;
    type: string;
    title: string;
    details: string;
    cost_in_base_currency: number;
    start_time: string | null;
    end_time: string | null;
    order: number;
    checkout_date: string | null;
    meal_type: string | null;
    address: string | null;
    google_maps_url: string | null;
    phone_number: string | null;
    website_url: string | null;
}

interface DbFlight {
    id: string;
    trip_id: string;
    confirmation_code: string;
    date: string;
    airline: string;
    flight_number: string;
    departure_airport: string;
    departure_time: string;
    arrival_airport: string;
    arrival_time: string;
    seat: string;
    is_return: boolean | null;
    is_overnight: boolean | null;
    return_flight: ReturnFlightDetails | null;
}

interface DbTrip {
    id: string;
    pnr_code: string;
    name: string;
    start_date: string;
    end_date: string;
    exchange_rate: number;
}

function dbBlockToBlock(row: DbBlock): ItineraryBlock {
    return {
        id: row.id,
        dayId: row.day_id,
        type: row.type as ItineraryBlock['type'],
        title: row.title,
        details: row.details,
        costInBaseCurrency: Number(row.cost_in_base_currency),
        startTime: row.start_time ?? undefined,
        endTime: row.end_time ?? undefined,
        order: row.order,
        checkoutDate: row.checkout_date ?? undefined,
        mealType: row.meal_type as ItineraryBlock['mealType'],
        address: row.address ?? undefined,
        googleMapsUrl: row.google_maps_url ?? undefined,
        phoneNumber: row.phone_number ?? undefined,
        websiteUrl: row.website_url ?? undefined,
    };
}

function dbFlightToFlight(row: DbFlight): Flight {
    return {
        id: row.id,
        confirmationCode: row.confirmation_code,
        date: row.date,
        airline: row.airline,
        flightNumber: row.flight_number,
        departureAirport: row.departure_airport,
        departureTime: row.departure_time,
        arrivalAirport: row.arrival_airport,
        arrivalTime: row.arrival_time,
        seat: row.seat,
        isReturn: row.is_return ?? undefined,
        isOvernight: row.is_overnight ?? undefined,
        returnFlight: row.return_flight ?? undefined,
    };
}

function dbTripToConfig(row: DbTrip): TripConfig {
    return {
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        exchangeRate: Number(row.exchange_rate),
    };
}

// ============================================
// Hook
// ============================================

/**
 * Subscribes to Supabase Postgres Changes for the current trip.
 * Automatically applies remote inserts, updates, and deletes to the Zustand store.
 * Ignores "echo" events from the current client using the recently-written ID set.
 */
export function useRealtimeSync() {
    const tripId = useTripStore((s) => s.tripId);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!tripId) return;

        const store = useTripStore.getState();

        // Clean up any existing subscription
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`trip-${tripId}`)

            // ---- Blocks ----
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'blocks',
                    filter: `trip_id=eq.${tripId}`,
                },
                (payload) => {
                    const row = payload.new as DbBlock;
                    if (wasRecentlyWritten(row.id)) return;
                    store._applyRemoteBlockInsert(dbBlockToBlock(row));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'blocks',
                    filter: `trip_id=eq.${tripId}`,
                },
                (payload) => {
                    const row = payload.new as DbBlock;
                    if (wasRecentlyWritten(row.id)) return;
                    const block = dbBlockToBlock(row);
                    store._applyRemoteBlockUpdate(row.id, block);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'blocks',
                    filter: `trip_id=eq.${tripId}`,
                },
                (payload) => {
                    const row = payload.old as { id: string };
                    if (wasRecentlyWritten(row.id)) return;
                    store._applyRemoteBlockDelete(row.id);
                }
            )

            // ---- Flights ----
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'flights',
                    filter: `trip_id=eq.${tripId}`,
                },
                (payload) => {
                    const row = payload.new as DbFlight;
                    if (wasRecentlyWritten(row.id)) return;
                    store._applyRemoteFlightInsert(dbFlightToFlight(row));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'flights',
                    filter: `trip_id=eq.${tripId}`,
                },
                (payload) => {
                    const row = payload.new as DbFlight;
                    if (wasRecentlyWritten(row.id)) return;
                    const flight = dbFlightToFlight(row);
                    store._applyRemoteFlightUpdate(row.id, flight);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'flights',
                    filter: `trip_id=eq.${tripId}`,
                },
                (payload) => {
                    const row = payload.old as { id: string };
                    if (wasRecentlyWritten(row.id)) return;
                    store._applyRemoteFlightDelete(row.id);
                }
            )

            // ---- Trip config ----
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'trips',
                    filter: `id=eq.${tripId}`,
                },
                (payload) => {
                    const row = payload.new as DbTrip;
                    if (wasRecentlyWritten(row.id)) return;
                    store._applyRemoteConfigUpdate(dbTripToConfig(row));
                }
            )

            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [tripId]);
}

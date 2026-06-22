import supabase from '../lib/supabase';
import type { TripConfig, ItineraryBlock, Flight, ReturnFlightDetails } from '../store/useTripStore';

// ============================================
// Type Mapping: camelCase (app) ↔ snake_case (DB)
// ============================================

interface DbTrip {
    id: string;
    pnr_code: string;
    name: string;
    start_date: string;
    end_date: string;
    exchange_rate: number;
    created_at: string;
    updated_at: string;
}

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

// ============================================
// Mappers
// ============================================

function dbTripToConfig(row: DbTrip): TripConfig {
    return {
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        exchangeRate: Number(row.exchange_rate),
    };
}

function configToDbTrip(config: TripConfig, pnrCode: string): Omit<DbTrip, 'id' | 'created_at' | 'updated_at'> {
    return {
        pnr_code: pnrCode,
        name: config.name,
        start_date: config.startDate,
        end_date: config.endDate,
        exchange_rate: config.exchangeRate,
    };
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

function blockToDbInsert(tripId: string, block: Omit<ItineraryBlock, 'id'>): Omit<DbBlock, 'id'> {
    return {
        trip_id: tripId,
        day_id: block.dayId,
        type: block.type,
        title: block.title,
        details: block.details,
        cost_in_base_currency: block.costInBaseCurrency,
        start_time: block.startTime ?? null,
        end_time: block.endTime ?? null,
        order: block.order,
        checkout_date: block.checkoutDate ?? null,
        meal_type: block.mealType ?? null,
        address: block.address ?? null,
        google_maps_url: block.googleMapsUrl ?? null,
        phone_number: block.phoneNumber ?? null,
        website_url: block.websiteUrl ?? null,
    };
}

function blockToDbUpdate(updates: Partial<ItineraryBlock>): Record<string, unknown> {
    const db: Record<string, unknown> = {};
    if (updates.dayId !== undefined) db.day_id = updates.dayId;
    if (updates.type !== undefined) db.type = updates.type;
    if (updates.title !== undefined) db.title = updates.title;
    if (updates.details !== undefined) db.details = updates.details;
    if (updates.costInBaseCurrency !== undefined) db.cost_in_base_currency = updates.costInBaseCurrency;
    if (updates.startTime !== undefined) db.start_time = updates.startTime || null;
    if (updates.endTime !== undefined) db.end_time = updates.endTime || null;
    if (updates.order !== undefined) db.order = updates.order;
    if (updates.checkoutDate !== undefined) db.checkout_date = updates.checkoutDate || null;
    if (updates.mealType !== undefined) db.meal_type = updates.mealType || null;
    if (updates.address !== undefined) db.address = updates.address || null;
    if (updates.googleMapsUrl !== undefined) db.google_maps_url = updates.googleMapsUrl || null;
    if (updates.phoneNumber !== undefined) db.phone_number = updates.phoneNumber || null;
    if (updates.websiteUrl !== undefined) db.website_url = updates.websiteUrl || null;
    return db;
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

function flightToDbInsert(tripId: string, flight: Omit<Flight, 'id'>): Omit<DbFlight, 'id'> {
    return {
        trip_id: tripId,
        confirmation_code: flight.confirmationCode,
        date: flight.date,
        airline: flight.airline,
        flight_number: flight.flightNumber,
        departure_airport: flight.departureAirport,
        departure_time: flight.departureTime,
        arrival_airport: flight.arrivalAirport,
        arrival_time: flight.arrivalTime,
        seat: flight.seat,
        is_return: flight.isReturn ?? null,
        is_overnight: flight.isOvernight ?? null,
        return_flight: flight.returnFlight ?? null,
    };
}

function flightToDbUpdate(updates: Partial<Flight>): Record<string, unknown> {
    const db: Record<string, unknown> = {};
    if (updates.confirmationCode !== undefined) db.confirmation_code = updates.confirmationCode;
    if (updates.date !== undefined) db.date = updates.date;
    if (updates.airline !== undefined) db.airline = updates.airline;
    if (updates.flightNumber !== undefined) db.flight_number = updates.flightNumber;
    if (updates.departureAirport !== undefined) db.departure_airport = updates.departureAirport;
    if (updates.departureTime !== undefined) db.departure_time = updates.departureTime;
    if (updates.arrivalAirport !== undefined) db.arrival_airport = updates.arrivalAirport;
    if (updates.arrivalTime !== undefined) db.arrival_time = updates.arrivalTime;
    if (updates.seat !== undefined) db.seat = updates.seat;
    if (updates.isReturn !== undefined) db.is_return = updates.isReturn;
    if (updates.isOvernight !== undefined) db.is_overnight = updates.isOvernight;
    if (updates.returnFlight !== undefined) db.return_flight = updates.returnFlight ?? null;
    return db;
}

// ============================================
// Trip Operations
// ============================================

export async function createTrip(config: TripConfig, pnrCode: string) {
    const { data, error } = await supabase
        .from('trips')
        .insert(configToDbTrip(config, pnrCode))
        .select()
        .single();

    if (error) throw error;
    return { id: (data as DbTrip).id, config: dbTripToConfig(data as DbTrip), pnrCode };
}

export async function fetchTripByPnr(pnr: string) {
    // Fetch the trip
    const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('pnr_code', pnr)
        .maybeSingle();

    if (tripError) throw tripError;
    if (!tripData) return null; // Trip not found

    const trip = tripData as DbTrip;

    // Fetch blocks and flights in parallel
    const [blocksResult, flightsResult] = await Promise.all([
        supabase.from('blocks').select('*').eq('trip_id', trip.id),
        supabase.from('flights').select('*').eq('trip_id', trip.id),
    ]);

    if (blocksResult.error) throw blocksResult.error;
    if (flightsResult.error) throw flightsResult.error;

    return {
        tripId: trip.id,
        pnrCode: trip.pnr_code,
        config: dbTripToConfig(trip),
        blocks: (blocksResult.data as DbBlock[]).map(dbBlockToBlock),
        flights: (flightsResult.data as DbFlight[]).map(dbFlightToFlight),
    };
}

export async function updateTripConfig(tripId: string, config: TripConfig) {
    const { error } = await supabase
        .from('trips')
        .update({
            name: config.name,
            start_date: config.startDate,
            end_date: config.endDate,
            exchange_rate: config.exchangeRate,
        })
        .eq('id', tripId);

    if (error) throw error;
}

// ============================================
// Block Operations
// ============================================

export async function addBlock(tripId: string, block: Omit<ItineraryBlock, 'id'>) {
    const { data, error } = await supabase
        .from('blocks')
        .insert(blockToDbInsert(tripId, block))
        .select()
        .single();

    if (error) throw error;
    return dbBlockToBlock(data as DbBlock);
}

export async function updateBlock(blockId: string, updates: Partial<ItineraryBlock>) {
    const dbUpdates = blockToDbUpdate(updates);
    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase
        .from('blocks')
        .update(dbUpdates)
        .eq('id', blockId);

    if (error) throw error;
}

export async function deleteBlock(blockId: string) {
    const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId);

    if (error) throw error;
}

/**
 * Batch-update blocks for drag-and-drop reorder and cross-day moves.
 * Upserts all provided blocks for a given trip.
 */
export async function syncBlocks(tripId: string, blocks: ItineraryBlock[]) {
    // We upsert all blocks — this handles reorders and cross-day moves
    const dbRows = blocks.map((block) => ({
        id: block.id,
        ...blockToDbInsert(tripId, block),
    }));

    if (dbRows.length === 0) return;

    const { error } = await supabase
        .from('blocks')
        .upsert(dbRows, { onConflict: 'id' });

    if (error) throw error;
}

// ============================================
// Flight Operations
// ============================================

export async function addFlight(tripId: string, flight: Omit<Flight, 'id'>) {
    const { data, error } = await supabase
        .from('flights')
        .insert(flightToDbInsert(tripId, flight))
        .select()
        .single();

    if (error) throw error;
    return dbFlightToFlight(data as DbFlight);
}

export async function updateFlight(flightId: string, updates: Partial<Flight>) {
    const dbUpdates = flightToDbUpdate(updates);
    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase
        .from('flights')
        .update(dbUpdates)
        .eq('id', flightId);

    if (error) throw error;
}

export async function deleteFlight(flightId: string) {
    const { error } = await supabase
        .from('flights')
        .delete()
        .eq('id', flightId);

    if (error) throw error;
}

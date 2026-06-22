import supabase from './supabase';

// Characters that are unambiguous when read aloud or in text messages
// Excludes: 0/O (zero vs oh), 1/I/L (one vs I vs L)
const PNR_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PNR_LENGTH = 6;

/**
 * Generate a random PNR code and verify it's unique in the database.
 * Format: 6 alphanumeric characters (e.g., "K7X3M2")
 */
export async function generatePnr(): Promise<string> {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = generateRandomCode();
        const { data } = await supabase
            .from('trips')
            .select('id')
            .eq('pnr_code', code)
            .maybeSingle();

        if (!data) {
            return code; // No collision, code is unique
        }
    }
    throw new Error('Failed to generate a unique PNR code after multiple attempts.');
}

/**
 * Validate and normalize a PNR code input from the user.
 * Returns the normalized code or null if invalid.
 */
export function normalizePnr(input: string): string | null {
    const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length !== PNR_LENGTH) return null;
    // Check all characters are in the valid charset
    for (const char of cleaned) {
        if (!PNR_CHARSET.includes(char)) return null;
    }
    return cleaned;
}

function generateRandomCode(): string {
    const array = new Uint8Array(PNR_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map((byte) => PNR_CHARSET[byte % PNR_CHARSET.length])
        .join('');
}

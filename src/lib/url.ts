import { normalizePnr } from './pnr';

export interface UrlTripCodeResult {
    raw: string | null;
    code: string | null; // normalized valid code
    isInvalid: boolean;  // true if a parameter was provided but failed validation
}

/**
 * Extracts a trip code from the URL.
 * Checks query parameters (?trip=... or ?code=...) first,
 * then falls back to hash (#... or #/... or #trip=...).
 */
export function getTripCodeFromUrl(): UrlTripCodeResult {
    if (typeof window === 'undefined') {
        return { raw: null, code: null, isInvalid: false };
    }

    const searchParams = new URLSearchParams(window.location.search);
    let raw = searchParams.get('trip') || searchParams.get('code');

    // Fallback: check hash fragment
    if (!raw && window.location.hash) {
        const cleanedHash = window.location.hash.replace(/^#\/?/, '').trim();
        if (cleanedHash) {
            if (cleanedHash.startsWith('trip=') || cleanedHash.startsWith('code=')) {
                const hashParams = new URLSearchParams(cleanedHash);
                raw = hashParams.get('trip') || hashParams.get('code');
            } else if (!cleanedHash.includes('/') && !cleanedHash.includes('&') && !cleanedHash.includes('=')) {
                raw = cleanedHash;
            }
        }
    }

    if (!raw) {
        return { raw: null, code: null, isInvalid: false };
    }

    const normalized = normalizePnr(raw);
    if (!normalized) {
        return { raw, code: null, isInvalid: true };
    }

    return { raw, code: normalized, isInvalid: false };
}

/**
 * Generates the canonical shareable URL for a trip code.
 * Example: https://velocifamily.github.io/NiponGo/?trip=K7X3M2
 */
export function getTripShareUrl(pnr: string): string {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('trip', pnr);
    url.searchParams.delete('code');
    url.hash = '';
    return url.toString();
}

/**
 * Updates the browser's address bar without triggering a page reload.
 * When pnr is null, removes trip/code query params and hashes.
 */
export function syncTripUrl(pnr: string | null, mode: 'replace' | 'push' = 'replace') {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const currentTripParam = url.searchParams.get('trip');

    if (pnr) {
        if (currentTripParam === pnr && !url.searchParams.has('code') && !url.hash) {
            return; // already in sync
        }
        url.searchParams.set('trip', pnr);
        url.searchParams.delete('code');
        url.hash = '';
    } else {
        if (!url.searchParams.has('trip') && !url.searchParams.has('code') && !url.hash) {
            return; // already clean
        }
        url.searchParams.delete('trip');
        url.searchParams.delete('code');
        url.hash = '';
    }

    const newRelativePathQuery = url.pathname + (url.search ? url.search : '');
    if (mode === 'push') {
        window.history.pushState(null, '', newRelativePathQuery);
    } else {
        window.history.replaceState(null, '', newRelativePathQuery);
    }
}

/**
 * Shares or copies the trip link.
 * Uses native Web Share API on supported devices (mobile),
 * falling back to clipboard copy.
 */
export async function shareTrip(pnr: string, tripName?: string): Promise<'shared' | 'copied' | 'failed'> {
    const shareUrl = getTripShareUrl(pnr);
    const title = tripName ? `${tripName} — NipponGo` : 'NipponGo Japan Trip';
    const text = tripName
        ? `Join our Japan trip "${tripName}" on NipponGo!`
        : 'Join our Japan trip on NipponGo!';

    if (typeof navigator !== 'undefined' && navigator.share) {
        try {
            await navigator.share({
                title,
                text,
                url: shareUrl,
            });
            return 'shared';
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                return 'failed'; // User dismissed the share sheet
            }
            // Fall through to clipboard copy
        }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(shareUrl);
            return 'copied';
        } catch {
            return 'failed';
        }
    }

    return 'failed';
}

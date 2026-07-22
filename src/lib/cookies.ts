export interface RecentTrip {
    code: string;
    name: string;
    joinedAt: number;
}

export function getRecentTrips(): RecentTrip[] {
    try {
        const name = 'nipongo-recent-trips=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                const jsonStr = c.substring(name.length, c.length);
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        }
    } catch (e) {
        console.error('Failed to parse recent trips cookie:', e);
    }
    return [];
}

export function saveRecentTrip(code: string, name: string) {
    try {
        const recent = getRecentTrips();
        // Remove existing if it's there (case-insensitive comparison)
        const filtered = recent.filter(t => t.code.toUpperCase() !== code.toUpperCase());
        // Insert at the beginning
        const updated = [
            { code: code.toUpperCase(), name: name || 'Unnamed Trip', joinedAt: Date.now() },
            ...filtered
        ].slice(0, 5); // Limit to last 5 recent trips

        // Save for 365 days
        const d = new Date();
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = `nipongo-recent-trips=${encodeURIComponent(JSON.stringify(updated))};${expires};path=/;SameSite=Strict`;
    } catch (e) {
        console.error('Failed to save recent trip cookie:', e);
    }
}

export function removeRecentTrip(code: string) {
    try {
        const recent = getRecentTrips();
        const filtered = recent.filter(t => t.code.toUpperCase() !== code.toUpperCase());
        const d = new Date();
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = `nipongo-recent-trips=${encodeURIComponent(JSON.stringify(filtered))};${expires};path=/;SameSite=Strict`;
    } catch (e) {
        console.error('Failed to remove recent trip cookie:', e);
    }
}

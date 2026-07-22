import { useTripStore } from '../store/useTripStore';

export function useFormatPrice() {
    const displayCurrency = useTripStore((state) => state.displayCurrency);
    const exchangeRate = useTripStore((state) => state.config?.exchangeRate) || 150;

    const formatPrice = (yenAmount: number) => {
        if (displayCurrency === 'USD') {
            const usdAmount = yenAmount / exchangeRate;
            // If it's a whole dollar amount, don't show cents. Otherwise show 2 decimal places.
            const hasCents = usdAmount % 1 !== 0;
            return `$${usdAmount.toLocaleString(undefined, {
                minimumFractionDigits: hasCents ? 2 : 0,
                maximumFractionDigits: 2,
            })}`;
        }
        return `¥${yenAmount.toLocaleString()}`;
    };

    return { formatPrice, displayCurrency, exchangeRate };
}

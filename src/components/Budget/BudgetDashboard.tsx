import React, { useMemo } from 'react';
import { useTripStore, type BlockCategory } from '../../store/useTripStore';
import { Bed, Train, Utensils, MapPin } from 'lucide-react';
import { useFormatPrice } from '../../hooks/useFormatPrice';

const BudgetDashboard: React.FC = () => {
    const { config, blocks } = useTripStore();
    const { formatPrice, displayCurrency, exchangeRate } = useFormatPrice();

    const { totals, grandTotal } = useMemo(() => {
        const defaultTotals: Record<BlockCategory, number> = {
            Accommodation: 0,
            Transportation: 0,
            Food: 0,
            Activity: 0,
        };

        const adultsCount = config?.adults ?? 1;
        const kidsCount = config?.children ?? 0;

        let grand = 0;

        blocks.forEach((block) => {
            if (block.costInBaseCurrency) {
                const kidPrice = block.hasKidsPrice 
                    ? (block.kidsCostInBaseCurrency ?? Math.round(block.costInBaseCurrency / 2)) 
                    : block.costInBaseCurrency;
                const blockTotal = (block.costInBaseCurrency * adultsCount) + (kidPrice * kidsCount);
                defaultTotals[block.type] += blockTotal;
                grand += blockTotal;
            }
        });

        return { totals: defaultTotals, grandTotal: grand };
    }, [blocks, config]);

    const getIcon = (type: BlockCategory, size: number = 24) => {
        switch (type) {
            case 'Accommodation':
                return <Bed size={size} className="text-[#8b5cf6]" />;
            case 'Transportation':
                return <Train size={size} className="text-[#0ea5e9]" />;
            case 'Food':
                return <Utensils size={size} className="text-[#f97316]" />;
            case 'Activity':
                return <MapPin size={size} className="text-[#10b981]" />;
        }
    };

    const categories: { type: BlockCategory; label: string; colorClass: string; bgClass: string }[] = [
        { type: 'Accommodation', label: 'Accommodations', colorClass: 'text-[#8b5cf6]', bgClass: 'bg-[#8b5cf6]' },
        { type: 'Transportation', label: 'Transportation', colorClass: 'text-[#0ea5e9]', bgClass: 'bg-[#0ea5e9]' },
        { type: 'Food', label: 'Food & Dining', colorClass: 'text-[#f97316]', bgClass: 'bg-[#f97316]' },
        { type: 'Activity', label: 'Activities', colorClass: 'text-[#10b981]', bgClass: 'bg-[#10b981]' },
    ];

    const formatSecondaryTotal = (yenVal: number) => {
        if (displayCurrency === 'JPY') {
            const usdVal = yenVal / exchangeRate;
            return `$${usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            return `¥${yenVal.toLocaleString()}`;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-[#1c2541] mb-2 font-serif">Trip Budget</h2>
                    <p className="text-[#6b7280] mb-2">Keep track of your estimated costs and spending.</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8a9a5b]/10 border border-[#8a9a5b]/25 rounded-full text-xs text-[#728247] font-medium">
                        <span>{config?.adults ?? 1} { (config?.adults ?? 1) === 1 ? 'Adult' : 'Adults' }</span>
                        {config?.children ? (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8a9a5b]/40"></span>
                                <span>{config.children} { config.children === 1 ? 'Child' : 'Children' }</span>
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="bg-[#f5f5f3] rounded-lg p-6 text-right min-w-[200px] border border-gray-200 shadow-inner">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-1">Grand Total</p>
                    <div className="text-4xl font-bold text-[#1c2541]">
                        {formatPrice(grandTotal)}
                    </div>
                    <div className="text-lg font-medium text-[#8a9a5b] mt-1">
                        ~ {formatSecondaryTotal(grandTotal)}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                        Rate: 1 USD = ¥{exchangeRate}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map(({ type, label, bgClass }) => {
                    const yenTotal = totals[type];
                    const perc = grandTotal === 0 ? 0 : Math.round((yenTotal / grandTotal) * 100);

                    return (
                        <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                {getIcon(type, 28)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-lg font-semibold text-[#2c2c2c]">{label}</h3>
                                    <span className="text-sm font-medium text-gray-400">{perc}%</span>
                                </div>

                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-2xl font-bold text-[#1c2541]">
                                        {formatPrice(yenTotal)}
                                    </span>
                                    <span className="text-sm font-medium text-[#8a9a5b]">
                                        ({formatSecondaryTotal(yenTotal)})
                                    </span>
                                </div>

                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-2 rounded-full ${bgClass} transition-all duration-1000 ease-out`}
                                        style={{ width: `${perc}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {blocks.length === 0 && (
                <div className="text-center p-12 text-gray-400">
                    <p>No itinerary blocks found yet. Add some to see your budget breakdown!</p>
                </div>
            )}
        </div>
    );
};

export default BudgetDashboard;

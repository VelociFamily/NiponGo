import React, { useState, useEffect } from 'react';
import { useTripStore, type TripConfig } from '../store/useTripStore';
import { Copy, Check } from 'lucide-react';

const ConfigForm: React.FC = () => {
    const { config, currentPnr, tripId, setConfig } = useTripStore();
    const [formData, setFormData] = useState<TripConfig>({
        name: 'My Japan Trip',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        exchangeRate: 150,
        adults: 1,
        children: 0,
    });
    const [pnrCopied, setPnrCopied] = useState(false);

    useEffect(() => {
        if (config) {
            setFormData(config);
        }
    }, [config]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = {
                ...prev,
                [name]: (name === 'exchangeRate' || name === 'adults' || name === 'children') ? Number(value) : value,
            };
            if (name === 'startDate') {
                next.endDate = value;
            }
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setConfig(formData);
    };

    const handleCopyPnr = async () => {
        if (!currentPnr) return;
        try {
            await navigator.clipboard.writeText(currentPnr);
            setPnrCopied(true);
            setTimeout(() => setPnrCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#1c2541] mb-2 font-serif">Trip Configuration</h2>
                <p className="text-[#6b7280]">Set up the foundational details for your journey.</p>
            </div>

            {/* PNR Share Card — shown after trip is created */}
            {currentPnr && tripId && (
                <div className="mb-8 bg-[#8a9a5b]/10 border border-[#8a9a5b]/20 rounded-xl p-5">
                    <p className="text-sm font-medium text-[#1c2541] mb-2">Share this code with your family:</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="font-mono text-3xl font-bold text-[#1c2541] tracking-[0.4em]">
                            {currentPnr}
                        </span>
                        <button
                            onClick={handleCopyPnr}
                            className="p-2 rounded-lg hover:bg-[#8a9a5b]/20 transition-colors"
                            title="Copy trip code"
                        >
                            {pnrCopied ? (
                                <Check size={20} className="text-green-600" />
                            ) : (
                                <Copy size={20} className="text-[#6b7280]" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-[#6b7280] text-center mt-2">
                        Anyone with this code can view and edit the trip.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#2c2c2c] mb-1">
                        Trip Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none transition-all"
                        placeholder="e.g., Tokyo Adventure"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-[#2c2c2c] mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-[#2c2c2c] mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="adults" className="block text-sm font-medium text-[#2c2c2c] mb-1">
                            Number of Adults
                        </label>
                        <input
                            type="number"
                            id="adults"
                            name="adults"
                            value={formData.adults}
                            onChange={handleChange}
                            required
                            min="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="children" className="block text-sm font-medium text-[#2c2c2c] mb-1">
                            Number of Children
                        </label>
                        <input
                            type="number"
                            id="children"
                            name="children"
                            value={formData.children}
                            onChange={handleChange}
                            required
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="exchangeRate" className="block text-sm font-medium text-[#2c2c2c] mb-1">
                        Exchange Rate (Base Currency to Target Currency)
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-[#6b7280] font-medium">1 Home Currency =</span>
                        <input
                            type="number"
                            id="exchangeRate"
                            name="exchangeRate"
                            value={formData.exchangeRate}
                            onChange={handleChange}
                            required
                            min="0.01"
                            step="0.01"
                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none transition-all"
                        />
                        <span className="text-[#6b7280] font-medium">Yen (¥)</span>
                    </div>
                    <p className="mt-1 text-xs text-[#6b7280]">
                        This is used for the budget dashboard conversions.
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#8a9a5b] hover:bg-[#728247] text-white font-medium rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#8a9a5b] outline-none"
                    >
                        {config ? 'Update Configuration' : 'Start Planning'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ConfigForm;

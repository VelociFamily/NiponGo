import React, { useState, useEffect } from 'react';
import { useTripStore, type ItineraryBlock } from '../../store/useTripStore';
import { X, Map as MapIcon, Link as LinkIcon, Phone } from 'lucide-react';
import { parseISO, addDays, format, differenceInCalendarDays } from 'date-fns';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    dayId: string; // The day to add the block to
    existingBlock?: ItineraryBlock | null; // For editing
}

const BlockModal: React.FC<Props> = ({ isOpen, onClose, dayId, existingBlock }) => {
    const { addBlock, updateBlock, blocks } = useTripStore();

    const [formData, setFormData] = useState<Partial<ItineraryBlock>>({
        type: 'Activity',
        title: '',
        details: '',
        costInBaseCurrency: 0,
        startTime: '',
        endTime: '',
        checkoutDate: '',
        mealType: 'Dinner',
        address: '',
        googleMapsUrl: '',
        phoneNumber: '',
    });

    useEffect(() => {
        if (existingBlock) {
            setFormData({
                type: existingBlock.type,
                title: existingBlock.title,
                details: existingBlock.details,
                costInBaseCurrency: existingBlock.costInBaseCurrency,
                startTime: existingBlock.startTime || '',
                endTime: existingBlock.endTime || '',
                checkoutDate: existingBlock.checkoutDate || '',
                mealType: existingBlock.mealType || 'Dinner',
                address: existingBlock.address || '',
                googleMapsUrl: existingBlock.googleMapsUrl || '',
                phoneNumber: existingBlock.phoneNumber || '',
            });
        } else {
            setFormData({
                type: 'Activity',
                title: '',
                details: '',
                costInBaseCurrency: 0,
                startTime: '',
                endTime: '',
                checkoutDate: '',
                mealType: 'Dinner',
                address: '',
                googleMapsUrl: '',
                phoneNumber: '',
            });
        }
    }, [existingBlock, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updates: any = { [name]: name === 'costInBaseCurrency' ? (value ? Number(value) : 0) : value };

            if (name === 'type') {
                if (value === 'Accommodation') {
                    if (!prev.startTime) updates.startTime = '16:00';
                    if (!prev.endTime) updates.endTime = '10:00';
                    if (!prev.checkoutDate && dayId) {
                        updates.checkoutDate = format(addDays(parseISO(dayId), 1), 'yyyy-MM-dd');
                    }
                } else if (value === 'Food') {
                    const mealType = prev.mealType || 'Dinner';
                    updates.mealType = mealType;
                    // Apply defaults
                    switch (mealType) {
                        case 'Breakfast': updates.startTime = '08:00'; updates.endTime = '09:00'; break;
                        case 'Morning Snack': updates.startTime = '10:30'; updates.endTime = '11:00'; break;
                        case 'Lunch': updates.startTime = '12:30'; updates.endTime = '13:30'; break;
                        case 'Afternoon Snack': updates.startTime = '15:30'; updates.endTime = '16:00'; break;
                        case 'Dinner': updates.startTime = '19:00'; updates.endTime = '20:00'; break;
                    }
                }
            }

            if (name === 'mealType') {
                switch (value) {
                    case 'Breakfast': updates.startTime = '08:00'; updates.endTime = '09:00'; break;
                    case 'Morning Snack': updates.startTime = '10:30'; updates.endTime = '11:00'; break;
                    case 'Lunch': updates.startTime = '12:30'; updates.endTime = '13:30'; break;
                    case 'Afternoon Snack': updates.startTime = '15:30'; updates.endTime = '16:00'; break;
                    case 'Dinner': updates.startTime = '19:00'; updates.endTime = '20:00'; break;
                }
            }

            return { ...prev, ...updates };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (existingBlock) {
            updateBlock(existingBlock.id, {
                ...formData,
            });
        } else {
            const dayBlocks = blocks.filter(b => b.dayId === dayId);
            const maxOrder = dayBlocks.length > 0 ? Math.max(...dayBlocks.map(b => b.order)) : -1;

            addBlock({
                ...(formData as Omit<ItineraryBlock, 'id'>),
                dayId,
                order: maxOrder + 1,
            });
        }

        onClose();
    };

    const nights = () => {
        if (!formData.checkoutDate || !dayId) return 0;
        try {
            return differenceInCalendarDays(parseISO(formData.checkoutDate), parseISO(dayId));
        } catch {
            return 0;
        }
    };

    const generateMapLink = () => {
        if (!formData.address) return;
        const encoded = encodeURIComponent(formData.address);
        setFormData(prev => ({ ...prev, googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}` }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-[#f5f5f3]/50 sticky top-0 z-10">
                    <h3 className="font-semibold text-[#1c2541]">
                        {existingBlock ? 'Edit Event' : 'Add Event'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none bg-white"
                            >
                                <option value="Accommodation">Accommodation</option>
                                <option value="Transportation">Transportation</option>
                                <option value="Food">Food & Dining</option>
                                <option value="Activity">Activity</option>
                            </select>
                        </div>

                        {formData.type === 'Food' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meal</label>
                                <select
                                    name="mealType"
                                    value={formData.mealType}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none bg-white"
                                >
                                    <option value="Breakfast">Breakfast</option>
                                    <option value="Morning Snack">Morning Snack</option>
                                    <option value="Lunch">Lunch</option>
                                    <option value="Afternoon Snack">Afternoon Snack</option>
                                    <option value="Dinner">Dinner</option>
                                </select>
                            </div>
                        )}

                        {formData.type !== 'Food' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder={formData.type === 'Accommodation' ? 'e.g., Tokyo Hotel' : 'e.g., Shinkansen'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none"
                                />
                            </div>
                        )}
                    </div>

                    {formData.type === 'Food' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title (Restaurant Name)</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Sushi Dai"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.type === 'Accommodation' ? 'Check-in Time' : 'Start Time'}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none"
                                />
                                {formData.type === 'Accommodation' && dayId && (
                                    <span className="text-xs text-gray-500 whitespace-nowrap">{format(parseISO(dayId), 'MMM d')}</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.type === 'Accommodation' ? 'Check-out Time' : 'End Time'}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none"
                                />
                                {formData.type === 'Accommodation' && formData.checkoutDate && (
                                    <span className="text-xs text-gray-500 whitespace-nowrap">{format(parseISO(formData.checkoutDate), 'MMM d')}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {formData.type === 'Accommodation' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                                <input
                                    type="date"
                                    name="checkoutDate"
                                    value={formData.checkoutDate || ''}
                                    onChange={handleChange}
                                    min={dayId ? format(addDays(parseISO(dayId), 1), 'yyyy-MM-dd') : undefined}
                                    required={formData.type === 'Accommodation'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none"
                                />
                            </div>
                            <div className="flex items-end pb-2">
                                <span className="text-sm font-medium text-[#8a9a5b] bg-[#8a9a5b]/10 px-3 py-1.5 rounded-md">
                                    {nights() > 0 ? `Duration: ${nights()} night${nights() > 1 ? 's' : ''}` : 'Invalid dates'}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-4 space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location Details</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address or Location</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <MapIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="e.g., 1-1 Chiyoda, Tokyo"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={generateMapLink}
                                    className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Build Map Link
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                                <div className="relative">
                                    <LinkIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="url"
                                        name="googleMapsUrl"
                                        value={formData.googleMapsUrl}
                                        onChange={handleChange}
                                        placeholder="https://maps.app.goo.gl/..."
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="+81..."
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes & Confirmation #</label>
                        <textarea
                            name="details"
                            value={formData.details}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Booking refs, or additional notes"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost (in Yen ¥)</label>
                        <input
                            type="number"
                            name="costInBaseCurrency"
                            value={formData.costInBaseCurrency || ''}
                            onChange={handleChange}
                            min="0"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#8a9a5b] hover:bg-[#728247] rounded-lg transition-colors"
                        >
                            Save Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BlockModal;

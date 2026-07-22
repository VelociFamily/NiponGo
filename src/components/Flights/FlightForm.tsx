import React, { useState, useEffect } from 'react';
import { useTripStore, type Flight } from '../../store/useTripStore';
import { X } from 'lucide-react';

interface FlightFormProps {
    onClose: () => void;
    initialFlight?: Flight | null;
}

const FlightForm: React.FC<FlightFormProps> = ({ onClose, initialFlight }) => {
    const { addFlight, updateFlight } = useTripStore();
    
    const [formData, setFormData] = useState<any>({
        confirmationCode: '',
        date: '',
        airline: '',
        flightNumber: '',
        departureAirport: '',
        departureTime: '',
        arrivalAirport: '',
        arrivalTime: '',
        seat: '',
        isOvernight: false,
        isReturn: false
    });

    const [isRoundtrip, setIsRoundtrip] = useState(false);
    const [returnFormData, setReturnFormData] = useState({
        confirmationCode: '',
        date: '',
        airline: '',
        flightNumber: '',
        departureAirport: '',
        departureTime: '',
        arrivalAirport: '',
        arrivalTime: '',
        seat: '',
        isOvernight: false,
        isReturn: true
    });

    useEffect(() => {
        if (initialFlight) {
            setFormData({
                confirmationCode: initialFlight.confirmationCode,
                date: initialFlight.date,
                airline: initialFlight.airline,
                flightNumber: initialFlight.flightNumber,
                departureAirport: initialFlight.departureAirport,
                departureTime: initialFlight.departureTime,
                arrivalAirport: initialFlight.arrivalAirport,
                arrivalTime: initialFlight.arrivalTime,
                seat: initialFlight.seat || '',
                isOvernight: initialFlight.isOvernight || false,
                isReturn: initialFlight.isReturn || false
            });

            if (initialFlight.returnFlight) {
                setIsRoundtrip(true);
                setReturnFormData({
                    confirmationCode: initialFlight.confirmationCode, // Display only, not saved in returnFlight separately
                    date: initialFlight.returnFlight.date,
                    airline: initialFlight.returnFlight.airline,
                    flightNumber: initialFlight.returnFlight.flightNumber,
                    departureAirport: initialFlight.returnFlight.departureAirport,
                    departureTime: initialFlight.returnFlight.departureTime,
                    arrivalAirport: initialFlight.returnFlight.arrivalAirport,
                    arrivalTime: initialFlight.returnFlight.arrivalTime,
                    seat: initialFlight.returnFlight.seat || '',
                    isOvernight: initialFlight.returnFlight.isOvernight || false,
                    isReturn: true
                });
            }
        }
    }, [initialFlight]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleReturnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setReturnFormData({ ...returnFormData, [name]: type === 'checkbox' ? checked : value });
    };

    const toggleRoundtrip = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setIsRoundtrip(checked);
        if (checked) {
            setReturnFormData(prev => ({
                ...prev,
                departureAirport: formData.arrivalAirport,
                arrivalAirport: formData.departureAirport,
                airline: formData.airline,
                confirmationCode: formData.confirmationCode,
                date: formData.date
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalData: any = { ...formData };
        if (isRoundtrip) {
            finalData.returnFlight = {
                date: returnFormData.date,
                airline: returnFormData.airline,
                flightNumber: returnFormData.flightNumber,
                departureAirport: returnFormData.departureAirport,
                departureTime: returnFormData.departureTime,
                arrivalAirport: returnFormData.arrivalAirport,
                arrivalTime: returnFormData.arrivalTime,
                seat: returnFormData.seat,
                isOvernight: returnFormData.isOvernight
            };
        } else {
            finalData.returnFlight = undefined;
        }

        if (initialFlight) {
            updateFlight(initialFlight.id, finalData);
        } else {
            addFlight(finalData);
        }
        
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#1c2541]">
                    {initialFlight ? 'Edit Flight' : 'Add New Flight'}
                </h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code *</label>
                <input required type="text" name="confirmationCode" value={formData.confirmationCode} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. CBRWKS" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Airline *</label>
                    <input required type="text" name="airline" value={formData.airline} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. AA or American Airlines" />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number *</label>
                    <input required type="text" name="flightNumber" value={formData.flightNumber} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 61" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Airport *</label>
                    <input required type="text" name="departureAirport" value={formData.departureAirport} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. DFW Dallas/Fort Worth" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time *</label>
                    <input required type="text" name="departureTime" value={formData.departureTime} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 11:10 AM" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Airport *</label>
                    <input required type="text" name="arrivalAirport" value={formData.arrivalAirport} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. NRT Tokyo Narita" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time *</label>
                    <input required type="text" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 3:00 PM" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seat</label>
                    <input type="text" name="seat" value={formData.seat} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 24K" />
                </div>
            </div>

            <div className="flex gap-4 pt-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        name="isOvernight"
                        checked={formData.isOvernight}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#0ea5e9] border-gray-300 rounded focus:ring-[#0ea5e9]"
                    />
                    <span className="text-sm font-medium text-gray-700">Overnight Flight</span>
                </label>
            </div>

            <div className="pt-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isRoundtrip}
                        onChange={toggleRoundtrip}
                        className="w-4 h-4 text-[#0ea5e9] border-gray-300 rounded focus:ring-[#0ea5e9]"
                    />
                    <span className="text-sm font-medium text-gray-700">Add Return Flight (Roundtrip)?</span>
                </label>
            </div>

            {isRoundtrip && (
                <div className="pt-4 border-t border-gray-200 mt-4 space-y-4">
                    <h4 className="text-lg font-bold text-[#1c2541]">Return Flight Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input required type="date" name="date" value={returnFormData.date} onChange={handleReturnChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Airline *</label>
                            <input required type="text" name="airline" value={returnFormData.airline} onChange={handleReturnChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. AA or American Airlines" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number *</label>
                            <input required type="text" name="flightNumber" value={returnFormData.flightNumber} onChange={handleReturnChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 62" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Airport *</label>
                            <input required type="text" name="departureAirport" value={returnFormData.departureAirport} onChange={handleReturnChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. NRT Tokyo Narita" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time *</label>
                            <input required type="text" name="departureTime" value={returnFormData.departureTime} onChange={handleReturnChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 5:30 PM" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Airport *</label>
                            <input required type="text" name="arrivalAirport" value={returnFormData.arrivalAirport} onChange={handleReturnChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. DFW Dallas/Fort Worth" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time *</label>
                            <input required type="text" name="arrivalTime" value={returnFormData.arrivalTime} onChange={handleReturnChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 3:00 PM" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seat</label>
                            <input type="text" name="seat" value={returnFormData.seat} onChange={handleReturnChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 24K" />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-2 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isOvernight"
                                checked={returnFormData.isOvernight}
                                onChange={handleReturnChange}
                                className="w-4 h-4 text-[#0ea5e9] border-gray-300 rounded focus:ring-[#0ea5e9]"
                            />
                            <span className="text-sm font-medium text-gray-700">Overnight Flight</span>
                        </label>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button type="button" onClick={onClose} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#1c2541] border border-transparent rounded-md shadow-sm hover:bg-[#2c3a61]">
                    {initialFlight ? 'Save Changes' : 'Save Flight'}
                </button>
            </div>
        </form>
    );
};

export default FlightForm;

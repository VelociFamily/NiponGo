import React, { useState } from 'react';
import { useTripStore, type Flight } from '../../store/useTripStore';
import { Plane, Plus, Trash2, ExternalLink, Edit2 } from 'lucide-react';
import FlightForm from './FlightForm';

const FlightDashboard: React.FC = () => {
    const { flights, deleteFlight } = useTripStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingFlight, setEditingFlight] = useState<Flight | null>(null);

    const handleOpenForm = (flight?: Flight) => {
        setEditingFlight(flight || null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingFlight(null);
        setIsFormOpen(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-[#1c2541] mb-2 font-serif flex items-center gap-3">
                        <Plane className="text-[#0ea5e9]" size={32} />
                        Flight Information
                    </h2>
                    <p className="text-[#6b7280]">Keep track of your flights, seats, and check statuses.</p>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="flex items-center gap-2 bg-[#1c2541] text-white px-5 py-2.5 rounded-lg hover:bg-[#2c3a61] transition-colors shadow-sm font-medium"
                >
                    <Plus size={18} />
                    Add Flight
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <FlightForm onClose={handleCloseForm} initialFlight={editingFlight} />
                </div>
            )}

            <div className="space-y-4">
                {(flights || []).map((flight) => (
                    <div key={flight.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#0ea5e9]"></div>
                        
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Airline & Date */}
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date & Flight</div>
                                <div className="text-lg font-bold text-[#1c2541]">{flight.date}</div>
                                <div className="text-[#4b5563] font-medium">{flight.airline} {flight.flightNumber}</div>
                            </div>

                            {/* Departure -> Arrival */}
                            <div className="space-y-1 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Departure</div>
                                    <div className="text-2xl font-bold text-[#1c2541]">{flight.departureTime}</div>
                                    <div className="text-[#4b5563] truncate" title={flight.departureAirport}>{flight.departureAirport}</div>
                                </div>
                                <div className="hidden sm:flex flex-col items-center justify-center text-gray-300 px-4">
                                    <Plane size={24} className="text-[#0ea5e9] rotate-90 sm:rotate-0" />
                                    <div className="h-px w-full bg-gray-200 mt-2"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Arrival</div>
                                    <div className="text-2xl font-bold text-[#1c2541]">{flight.arrivalTime}</div>
                                    <div className="text-[#4b5563] truncate" title={flight.arrivalAirport}>{flight.arrivalAirport}</div>
                                </div>
                            </div>

                            {flight.returnFlight && (
                                <>
                                    <div className="md:col-span-3 border-t border-gray-100 my-2"></div>
                                    {/* Airline & Date (Return) */}
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Return Date & Flight</div>
                                        <div className="text-lg font-bold text-[#1c2541]">{flight.returnFlight.date}</div>
                                        <div className="text-[#4b5563] font-medium">{flight.returnFlight.airline} {flight.returnFlight.flightNumber}</div>
                                    </div>

                                    {/* Departure -> Arrival (Return) */}
                                    <div className="space-y-1 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Departure</div>
                                            <div className="text-2xl font-bold text-[#1c2541]">{flight.returnFlight.departureTime}</div>
                                            <div className="text-[#4b5563] truncate" title={flight.returnFlight.departureAirport}>{flight.returnFlight.departureAirport}</div>
                                        </div>
                                        <div className="hidden sm:flex flex-col items-center justify-center text-gray-300 px-4">
                                            <Plane size={24} className="text-[#0ea5e9] rotate-90 sm:rotate-0" />
                                            <div className="h-px w-full bg-gray-200 mt-2"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Arrival</div>
                                            <div className="text-2xl font-bold text-[#1c2541]">{flight.returnFlight.arrivalTime}</div>
                                            <div className="text-[#4b5563] truncate" title={flight.returnFlight.arrivalAirport}>{flight.returnFlight.arrivalAirport}</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Actions, Confirmation & Seat */}
                        <div className="w-full md:w-auto md:min-w-[200px] flex flex-col justify-between items-start md:items-end gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                            <div className="w-full flex justify-end gap-2 md:mb-2">
                                <button
                                    onClick={() => handleOpenForm(flight)}
                                    className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded hover:bg-blue-50"
                                    title="Edit Flight"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => deleteFlight(flight.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50"
                                    title="Delete Flight"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            
                            <div className="w-full flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end gap-4">
                                <div className="text-left md:text-right">
                                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Confirmation</div>
                                    <a 
                                        href={`https://www.google.com/search?q=${encodeURIComponent(flight.airline + ' ' + flight.flightNumber + ' flight status')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-md font-bold hover:bg-blue-100 transition-colors"
                                        title="Look up flight status"
                                    >
                                        {flight.confirmationCode}
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                <div className="text-left md:text-right">
                                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                                        {flight.returnFlight ? 'Seats' : 'Seat'}
                                    </div>
                                    {flight.returnFlight ? (
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium text-gray-500">
                                                Departure: <span className="font-bold text-[#2c2c2c] text-base">{flight.seat || 'Unassigned'}</span>
                                            </div>
                                            <div className="text-sm font-medium text-gray-500">
                                                Return: <span className="font-bold text-[#2c2c2c] text-base">{flight.returnFlight.seat || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-lg font-bold text-[#2c2c2c]">
                                            {flight.seat || 'Unassigned'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {(!flights || flights.length === 0) && !isFormOpen && (
                    <div className="text-center p-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                        <Plane size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">No flights added yet. Add your first flight above!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightDashboard;

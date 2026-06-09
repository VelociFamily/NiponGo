import React from 'react';
import { Plane, ExternalLink } from 'lucide-react';
import { type Flight } from '../../store/useTripStore';

interface Props {
    flight: Flight;
}

const FlightCard: React.FC<Props> = ({ flight }) => {
    return (
        <div className="relative group bg-sky-50/50 rounded-lg shadow-sm border border-sky-200 border-l-4 border-l-[#0ea5e9] p-3 transition-shadow cursor-default mb-1">
            <div className="flex items-start gap-2 pr-2">
                <div className="mt-0.5 p-1.5 bg-white rounded-md shrink-0 text-[#0ea5e9] shadow-sm">
                    <Plane size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <h4 className="text-sm font-semibold text-[#1c2541] truncate">
                                {flight.airline} {flight.flightNumber}
                            </h4>
                        </div>
                        <div className="text-xs font-medium text-[#8a9a5b] whitespace-nowrap">
                            {flight.departureTime} - {flight.arrivalTime}
                        </div>
                    </div>

                    <div className="text-xs text-[#6b7280] mb-1.5 flex items-center gap-1">
                        <span className="font-medium truncate max-w-[100px]" title={flight.departureAirport}>{flight.departureAirport}</span>
                        <Plane size={10} className="mx-1 opacity-50 shrink-0" />
                        <span className="font-medium truncate max-w-[100px]" title={flight.arrivalAirport}>{flight.arrivalAirport}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                        <div className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-100 flex items-center gap-1.5">
                            <span className="text-gray-400 uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Conf</span>
                            <a 
                                href={`https://www.google.com/search?q=${encodeURIComponent(flight.airline + ' ' + flight.flightNumber + ' flight status')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-sky-600 hover:underline flex items-center gap-1"
                            >
                                {flight.confirmationCode}
                                <ExternalLink size={10} />
                            </a>
                        </div>
                        {flight.seat && (
                            <div className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-100 flex items-center gap-1.5">
                                <span className="text-gray-400 uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Seat</span>
                                <span className="font-bold text-[#1c2541]">{flight.seat}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlightCard;

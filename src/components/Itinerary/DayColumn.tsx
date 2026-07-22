import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type ItineraryBlock, type Flight, useTripStore } from '../../store/useTripStore';
import BlockCard from './BlockCard';
import FlightCard from './FlightCard';
import { Plus, Bed } from 'lucide-react';
import { useFormatPrice } from '../../hooks/useFormatPrice';

const AccommodationSegment: React.FC<{
    acc: ItineraryBlock & { _trackIndex?: number };
    trackIndex: number;
    isCheckIn: boolean;
    isCheckOut: boolean;
    isMiddle: boolean;
    dayId: string;
    onEditBlock: (block: ItineraryBlock) => void;
}> = ({ acc, trackIndex, isCheckIn, isCheckOut, isMiddle, dayId, onEditBlock }) => {
    const { config } = useTripStore();
    const { formatPrice } = useFormatPrice();
    const adultsCount = config?.adults ?? 1;
    const kidsCount = config?.children ?? 0;
    const kidPrice = acc.hasKidsPrice
        ? (acc.kidsCostInBaseCurrency ?? Math.round(acc.costInBaseCurrency / 2))
        : acc.costInBaseCurrency;
    const totalCost = (acc.costInBaseCurrency * adultsCount) + (kidPrice * kidsCount);

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `${acc.id}-seg-${dayId}`,
        data: { type: 'Block', block: acc },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined,
        top: trackIndex * 88,
        zIndex: isDragging ? 50 : (isCheckIn || isCheckOut ? 20 : 10),
    };

    if (isCheckIn && isCheckOut) {
        return (
            <div ref={setNodeRef} {...listeners} {...attributes} onClick={() => onEditBlock(acc)} style={style} className="absolute left-[15%] right-[15%] h-[76px] bg-white border border-gray-200 border-l-[4px] border-l-[#8b5cf6] rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center px-3 overflow-hidden">
                <div className="text-sm font-bold text-[#1c2541] truncate text-center">{acc.title}</div>
            </div>
        );
    }

    if (isCheckIn) {
        return (
            <div ref={setNodeRef} {...listeners} {...attributes} onClick={() => onEditBlock(acc)} style={style} className="absolute right-[-24px] left-[52%] h-[76px] bg-white border-y border-gray-200 border-l-[4px] border-l-[#8b5cf6] border-r-0 rounded-l-xl cursor-pointer hover:bg-gray-50 transition-colors flex flex-col justify-center pl-3 pr-6 overflow-hidden">
                <div className="flex items-center gap-1.5 mb-1">
                    <Bed size={14} className="text-[#8b5cf6] shrink-0" />
                    <span className="text-sm font-bold text-[#1c2541] truncate">{acc.title}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium whitespace-nowrap">{acc.startTime || '16:00'}</span>
                    {totalCost > 0 && (
                        <span className="font-semibold text-[#8b5cf6] ml-2">{formatPrice(totalCost)}</span>
                    )}
                </div>
            </div>
        );
    }

    if (isCheckOut) {
        return (
            <div ref={setNodeRef} {...listeners} {...attributes} onClick={() => onEditBlock(acc)} style={style} className="absolute left-[-24px] right-[52%] h-[76px] bg-white border-y border-gray-200 border-r border-r-gray-200 border-l-0 rounded-r-xl cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center justify-center px-2 overflow-hidden">
                <div className="text-[10px] text-[#8b5cf6] font-bold mb-0.5 uppercase tracking-widest">OUT</div>
                <div className="text-xs text-gray-500 font-medium truncate">{acc.endTime || '10:00'}</div>
            </div>
        );
    }

    if (isMiddle) {
        return (
            <div ref={setNodeRef} {...listeners} {...attributes} onClick={() => onEditBlock(acc)} style={style} className="absolute left-[-24px] right-[-24px] h-[76px] bg-white border-y border-gray-200 border-x-0 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col justify-center px-4 overflow-hidden">
                <div className="text-center text-[#8b5cf6]/30 font-bold tracking-widest uppercase text-xs truncate">
                    {acc.title}
                </div>
            </div>
        );
    }

    return null;
};


interface Props {
    dayId: string;
    dateStr: string;
    blocks: ItineraryBlock[];
    accommodations?: (ItineraryBlock & { _trackIndex?: number })[];
    flights?: Flight[];
    bottomFlights?: Flight[];
    onAddBlock: (dayId: string) => void;
    onEditBlock: (block: ItineraryBlock) => void;
}

const DayColumn: React.FC<Props> = ({ dayId, dateStr, blocks, accommodations, flights, bottomFlights, onAddBlock, onEditBlock }) => {
    const { setNodeRef } = useDroppable({
        id: dayId,
        data: { type: 'Column', dayId },
    });

    // Sort blocks by order
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

    const maxTrack = accommodations && accommodations.length > 0
        ? Math.max(...accommodations.map(a => a._trackIndex || 0))
        : -1;
    const containerHeight = maxTrack >= 0 ? (maxTrack + 1) * 88 : 0;

    return (
        <div className="flex flex-col min-w-[280px] w-[320px] shrink-0">
            <div className="flex-1 bg-[#f5f5f3]/50 rounded-xl p-3 border border-gray-200 shadow-sm flex flex-col min-h-[150px] print:shadow-none print:border-none print:bg-transparent print:p-0 relative z-10">
                <div className="flex justify-between items-center mb-4 px-2 print:mb-2">
                    <div>
                        <h3 className="font-bold text-[#1c2541] font-serif">{dateStr}</h3>
                        <p className="text-xs text-[#8a9a5b] font-medium">Day View</p>
                    </div>
                    <button
                        onClick={() => onAddBlock(dayId)}
                        className="p-1.5 bg-[#8a9a5b]/10 text-[#8a9a5b] hover:bg-[#8a9a5b] hover:text-white rounded-md transition-colors print:hidden"
                        title="Add Block"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div
                    ref={setNodeRef}
                    className="flex-1 flex flex-col gap-3 min-h-[150px]"
                >
                    {flights && flights.map(flight => (
                        <FlightCard key={`flight-${flight.id}`} flight={flight} />
                    ))}

                    <SortableContext
                        items={sortedBlocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {sortedBlocks.map((block) => (
                            <BlockCard
                                key={block.id}
                                block={block}
                                onClick={() => onEditBlock(block)}
                                baseCurrency="¥"
                            />
                        ))}
                    </SortableContext>

                    {bottomFlights && bottomFlights.length > 0 && (
                        <div className="mt-auto flex flex-col gap-3">
                            {bottomFlights.map(flight => (
                                <FlightCard key={`flight-bottom-${flight.id}`} flight={flight} />
                            ))}
                        </div>
                    )}

                    {sortedBlocks.length === 0 && (!flights || flights.length === 0) && (!bottomFlights || bottomFlights.length === 0) && (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm p-4 text-center print:hidden m-2">
                            Drop items here or click + to add an event
                        </div>
                    )}
                </div>
            </div>

            {accommodations && accommodations.length > 0 && (
                <div style={{ height: containerHeight }} className="mt-4 w-full relative print:hidden shrink-0">
                    {accommodations.map(acc => {
                        const trackIndex = acc._trackIndex || 0;
                        const isCheckIn = acc.dayId === dayId;
                        const isCheckOut = acc.checkoutDate === dayId;
                        const isMiddle = !isCheckIn && !isCheckOut;

                        return (
                            <AccommodationSegment
                                key={`${acc.id}-${dayId}`}
                                acc={acc}
                                trackIndex={trackIndex}
                                isCheckIn={isCheckIn}
                                isCheckOut={isCheckOut}
                                isMiddle={isMiddle}
                                dayId={dayId}
                                onEditBlock={onEditBlock}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DayColumn;

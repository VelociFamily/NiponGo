import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bed, Train, Utensils, MapPin, GripVertical, Map as MapIcon, Phone } from 'lucide-react';
import { type ItineraryBlock, type BlockCategory, useTripStore } from '../../store/useTripStore';
import { parseISO, format, differenceInCalendarDays } from 'date-fns';
import { useFormatPrice } from '../../hooks/useFormatPrice';

interface Props {
    block: ItineraryBlock;
    onClick: () => void;
    baseCurrency: string;
    isStatic?: boolean;
    cardId?: string;
}

const getIcon = (type: BlockCategory) => {
    switch (type) {
        case 'Accommodation':
            return <Bed size={16} className="text-[#8b5cf6]" />;
        case 'Transportation':
            return <Train size={16} className="text-[#0ea5e9]" />;
        case 'Food':
            return <Utensils size={16} className="text-[#f97316]" />;
        case 'Activity':
            return <MapPin size={16} className="text-[#10b981]" />;
    }
};

const getBorderColor = (type: BlockCategory) => {
    switch (type) {
        case 'Accommodation': return 'border-l-[#8b5cf6]';
        case 'Transportation': return 'border-l-[#0ea5e9]';
        case 'Food': return 'border-l-[#f97316]';
        case 'Activity': return 'border-l-[#10b981]';
    }
};

// URL to Link converter
const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline break-all"
                    onClick={(e) => e.stopPropagation()} // prevent dragging/opening modal
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    return timeStr; // Just returning as-is for now, could convert 24h to 12h
};

const BlockCard: React.FC<Props> = ({ block, onClick, baseCurrency: _baseCurrency, isStatic = false, cardId }) => {
    const { config } = useTripStore();
    const { formatPrice } = useFormatPrice();
    const adultsCount = config?.adults ?? 1;
    const kidsCount = config?.children ?? 0;
    const totalTravelers = adultsCount + kidsCount;

    const kidPrice = block.hasKidsPrice
        ? (block.kidsCostInBaseCurrency ?? Math.round(block.costInBaseCurrency / 2))
        : block.costInBaseCurrency;
    const totalCost = (block.costInBaseCurrency * adultsCount) + (kidPrice * kidsCount);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: cardId || block.id,
        data: { type: 'Block', block },
        disabled: isStatic
    });

    const style = {
        transform: isStatic ? undefined : CSS.Transform.toString(transform),
        transition: isStatic ? undefined : transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="w-full h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg opacity-50"
            />
        );
    }

    const nights = () => {
        if (!block.checkoutDate || !block.dayId) return 0;
        try {
            return differenceInCalendarDays(parseISO(block.checkoutDate), parseISO(block.dayId));
        } catch {
            return 0;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            className={`relative group bg-[#ffffff] rounded-lg shadow-sm border border-gray-200 border-l-4 ${getBorderColor(block.type)} p-3 hover:shadow-md transition-shadow cursor-pointer hover:border-r-gray-300`}
        >
            {!isStatic && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute right-2 top-2 p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical size={16} />
                </div>
            )}

            <div className="flex items-start gap-2 pr-6">
                <div className="mt-0.5 p-1.5 bg-gray-50 rounded-md shrink-0">
                    {getIcon(block.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            {block.type === 'Food' && (
                                <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-1.5 py-[1px] rounded shrink-0">
                                    {block.mealType}
                                </span>
                            )}
                            <h4 className="text-sm font-semibold text-[#1c2541] truncate">
                                {block.title}
                            </h4>
                        </div>

                        {/* Time & Dates Header */}
                        <div className="text-xs font-medium text-[#8a9a5b] whitespace-nowrap flex flex-col items-end">
                            <div>
                                {formatTime(block.startTime)} {block.endTime && `- ${formatTime(block.endTime)}`}
                            </div>
                            {block.type === 'Accommodation' && block.checkoutDate && (
                                <div className="text-[10px] text-gray-400 font-normal">
                                    {format(parseISO(block.dayId), 'MMM d')} - {format(parseISO(block.checkoutDate), 'MMM d')}
                                </div>
                            )}
                        </div>
                    </div>

                    {block.type === 'Accommodation' && block.checkoutDate && (
                        <div className="text-xs text-[#8b5cf6] font-medium mb-1.5">
                            {nights()} night{nights() > 1 ? 's' : ''} stay
                        </div>
                    )}

                    {(block.address || block.googleMapsUrl || block.phoneNumber) && (
                        <div className="flex flex-wrap gap-2 mb-1.5 detailed-info mt-1">
                            {block.googleMapsUrl ? (
                                <a
                                    href={block.googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50 px-1.5 py-0.5 rounded"
                                >
                                    <MapIcon size={12} />
                                    <span className="truncate max-w-[120px]">{block.address || 'View on Map'}</span>
                                </a>
                            ) : block.address ? (
                                <span className="flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                    <MapIcon size={12} />
                                    <span className="truncate max-w-[120px]">{block.address}</span>
                                </span>
                            ) : null}

                            {block.phoneNumber && (
                                <a
                                    href={`tel:${block.phoneNumber}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-800 hover:underline bg-gray-100 px-1.5 py-0.5 rounded"
                                >
                                    <Phone size={12} />
                                    {block.phoneNumber}
                                </a>
                            )}
                        </div>
                    )}

                    {block.details && (
                        <div className="text-xs text-[#6b7280] line-clamp-3 detailed-info mb-1.5 leading-relaxed bg-gray-50/50 p-1.5 rounded">
                            {renderTextWithLinks(block.details)}
                        </div>
                    )}

                    {(block.costInBaseCurrency > 0 || (block.hasKidsPrice && block.kidsCostInBaseCurrency !== undefined)) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <div className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-100 inline-block px-1.5 py-0.5 rounded">
                                {formatPrice(block.costInBaseCurrency)}
                                {totalTravelers > 1 && <span className="text-gray-400 font-normal ml-0.5">/ adult</span>}
                                {block.hasKidsPrice && (
                                    <span className="text-gray-500 font-normal ml-1.5">
                                        (Kids: {formatPrice(kidPrice)})
                                    </span>
                                )}
                            </div>
                            {totalTravelers > 1 && (
                                <div className="text-xs font-bold text-[#728247] bg-[#8a9a5b]/10 border border-[#8a9a5b]/20 inline-block px-1.5 py-0.5 rounded">
                                    Total: {formatPrice(totalCost)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlockCard;

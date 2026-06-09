import React, { useState, useMemo } from 'react';
import { useTripStore, type ItineraryBlock } from '../../store/useTripStore';
import { eachDayOfInterval, parseISO, format, subDays } from 'date-fns';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import DayColumn from './DayColumn';
import TrashZone from './TrashZone';
import BlockModal from './BlockModal';
import BlockCard from './BlockCard';

const ItineraryView: React.FC = () => {
    const { config, blocks, flights } = useTripStore();

    const [activeBlock, setActiveBlock] = useState<ItineraryBlock | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDayId, setModalDayId] = useState<string>('');
    const [editingBlock, setEditingBlock] = useState<ItineraryBlock | null>(null);

    const days = useMemo(() => {
        if (!config) return [];
        try {
            return eachDayOfInterval({
                start: parseISO(config.startDate),
                end: parseISO(config.endDate),
            });
        } catch {
            return [];
        }
    }, [config]);

    const accommodations = useMemo(() => {
        const accBlocks = blocks.filter(b => b.type === 'Accommodation' && b.checkoutDate);
        const sorted = [...accBlocks].sort((a, b) => a.dayId.localeCompare(b.dayId));
        const tracks: string[] = [];
        return sorted.map(acc => {
            let track = 0;
            while (tracks[track] && tracks[track] > acc.dayId) {
                track++;
            }
            tracks[track] = acc.checkoutDate!;
            return { ...acc, _trackIndex: track } as ItineraryBlock & { _trackIndex?: number };
        });
    }, [blocks]);

    const allFlightLegs = useMemo(() => {
        const legs: any[] = [];
        (flights || []).forEach(f => {
            legs.push(f);
            if (f.returnFlight) {
                legs.push({
                    id: f.id + '_return',
                    confirmationCode: f.confirmationCode,
                    date: f.returnFlight.date,
                    airline: f.returnFlight.airline,
                    flightNumber: f.returnFlight.flightNumber,
                    departureAirport: f.returnFlight.departureAirport,
                    departureTime: f.returnFlight.departureTime,
                    arrivalAirport: f.returnFlight.arrivalAirport,
                    arrivalTime: f.returnFlight.arrivalTime,
                    seat: f.returnFlight.seat,
                    isOvernight: f.returnFlight.isOvernight,
                    isReturn: true
                });
            }
        });
        return legs;
    }, [flights]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const block = blocks.find((b) => b.id === active.id);
        if (block) setActiveBlock(block);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        // Ignore trash here, handle in DragEnd
        if (over.id === 'trash-zone') return;

        const activeId = String(active.id);
        const overId = String(over.id);

        const currentBlocks = useTripStore.getState().blocks;
        const activeBlock = currentBlocks.find((b) => b.id === activeId);
        if (!activeBlock) return;

        const isOverColumn = over.data.current?.type === 'Column';
        const overBlock = currentBlocks.find((b) => b.id === overId);

        const activeColumnId = activeBlock.dayId;
        const overColumnId = isOverColumn ? overId : overBlock?.dayId;

        if (!overColumnId || activeColumnId === overColumnId) {
            return; // Moving in same column is handled in DragEnd
        }

        // Moving to a different column
        const overColBlocks = currentBlocks.filter(b => b.dayId === overColumnId);
        const maxOrder = overColBlocks.length > 0 ? Math.max(...overColBlocks.map(b => b.order)) : -1;

        useTripStore.getState().setBlocks(
            currentBlocks.map((block) => {
                if (block.id === activeId) {
                    return { ...block, dayId: overColumnId, order: maxOrder + 1 };
                }
                return block;
            })
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveBlock(null);

        if (!over) return;

        if (over.id === 'trash-zone') {
            useTripStore.getState().deleteBlock(String(active.id));
            return;
        }

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId !== overId) {
            const currentBlocks = useTripStore.getState().blocks;
            const activeItem = currentBlocks.find((b) => b.id === activeId);
            const overItem = currentBlocks.find((b) => b.id === overId);

            if (activeItem && overItem && activeItem.dayId === overItem.dayId) {
                // Swap or Reorder within the same column
                const columnBlocks = currentBlocks.filter(b => b.dayId === activeItem.dayId).sort((a, b) => a.order - b.order);

                const oldIndex = columnBlocks.findIndex(b => b.id === activeId);
                const newIndex = columnBlocks.findIndex(b => b.id === overId);

                // Reordering logic
                const newColumnBlocks = [...columnBlocks];
                const [removed] = newColumnBlocks.splice(oldIndex, 1);
                newColumnBlocks.splice(newIndex, 0, removed);

                // Update orders
                const updatedBlocks = currentBlocks.map(block => {
                    if (block.dayId === activeItem.dayId) {
                        const newOrder = newColumnBlocks.findIndex(b => b.id === block.id);
                        return { ...block, order: newOrder };
                    }
                    return block;
                });

                useTripStore.getState().setBlocks(updatedBlocks);
            }
        }
    };

    const handleAddBlock = (dayId: string) => {
        setModalDayId(dayId);
        setEditingBlock(null);
        setIsModalOpen(true);
    };

    const handleEditBlock = (block: ItineraryBlock) => {
        setModalDayId(block.dayId);
        setEditingBlock(block);
        setIsModalOpen(true);
    };

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.4',
                },
            },
        }),
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col print:h-auto">
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-6 custom-scrollbar print:overflow-visible">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                    <div className="flex gap-6 h-full items-stretch print:flex-col print:gap-8">
                        {days.map((date) => {
                            const dayStr = format(date, 'yyyy-MM-dd');
                            const displayDate = format(date, 'EEE, MMM do');

                            // Normal draggable blocks
                            const sortableDayBlocks = blocks.filter((b) => b.dayId === dayStr && !(b.type === 'Accommodation' && b.checkoutDate));

                            // Accommodations that span across this night
                            const tonightAccommodations = accommodations.filter(acc => {
                                if (!acc.checkoutDate) return false;
                                return dayStr >= acc.dayId && dayStr <= acc.checkoutDate;
                            });

                            const prevDate = subDays(date, 1);
                            const prevDayStr = format(prevDate, 'yyyy-MM-dd');

                            const topFlights = allFlightLegs.filter(f => {
                                if (f.date === dayStr && !f.isReturn) return true;
                                if (f.date === prevDayStr && f.isOvernight) return true;
                                return false;
                            });

                            const bottomFlights = allFlightLegs.filter(f => {
                                if (f.date === dayStr && f.isReturn) return true;
                                return false;
                            });

                            return (
                                <DayColumn
                                    key={dayStr}
                                    dayId={dayStr}
                                    dateStr={displayDate}
                                    blocks={sortableDayBlocks}
                                    accommodations={tonightAccommodations}
                                    flights={topFlights}
                                    bottomFlights={bottomFlights}
                                    onAddBlock={handleAddBlock}
                                    onEditBlock={handleEditBlock}
                                />
                            );
                        })}
                    </div>

                    <TrashZone />

                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeBlock ? (
                            <BlockCard
                                block={activeBlock}
                                onClick={() => { }}
                                baseCurrency="¥"
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <BlockModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                dayId={modalDayId}
                existingBlock={editingBlock}
            />
        </div>
    );
};

export default ItineraryView;

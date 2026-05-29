import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

const TrashZone: React.FC = () => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'trash-zone',
        data: { type: 'Trash' },
    });

    return (
        <div
            ref={setNodeRef}
            className={`fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-50 print:hidden ${isOver
                    ? 'bg-red-500 text-white scale-125 shadow-red-500/50'
                    : 'bg-white text-red-400 hover:text-red-500 hover:bg-red-50 border-2 border-red-100'
                }`}
        >
            <Trash2 size={24} className={isOver ? 'animate-bounce' : ''} />
        </div>
    );
};

export default TrashZone;

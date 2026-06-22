import React, { useState, useMemo, useEffect } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { eachDayOfInterval, parseISO, format } from 'date-fns';
import { Printer } from 'lucide-react';

type PrintMode = 'A' | 'B';

const PrintLayout: React.FC = () => {
    const { config, blocks, currentPnr } = useTripStore();
    const [printMode, setPrintMode] = useState<PrintMode>('A');

    useEffect(() => {
        // Add the class to body to affect the whole page during print
        document.body.classList.remove('print-mode-a', 'print-mode-b');
        document.body.classList.add(`print-mode-${printMode.toLowerCase()}`);
        return () => {
            document.body.classList.remove('print-mode-a', 'print-mode-b');
        };
    }, [printMode]);

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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Settings Panel - Hidden on Print */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-200 mb-8 print:hidden flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#1c2541] mb-2">Export to PDF</h2>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Choose a print mode and click the button to generate a PDF.
                        Mode A is an overview cheat sheet, and Mode B includes all your notes and details.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-[#f5f5f3] p-1 rounded-lg flex border border-gray-200">
                        <button
                            onClick={() => setPrintMode('A')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${printMode === 'A'
                                    ? 'bg-white text-[#1c2541] shadow-sm'
                                    : 'text-gray-500 hover:text-[#1c2541]'
                                }`}
                        >
                            Mode A (Condensed)
                        </button>
                        <button
                            onClick={() => setPrintMode('B')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${printMode === 'B'
                                    ? 'bg-white text-[#1c2541] shadow-sm'
                                    : 'text-gray-500 hover:text-[#1c2541]'
                                }`}
                        >
                            Mode B (Detailed)
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#1c2541] hover:bg-[#2c395c] text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <Printer size={18} />
                        Print / PDF
                    </button>
                </div>
            </div>

            {/* Printable Area */}
            <div className="bg-white p-2 md:p-12 print:p-0 rounded-xl shadow-sm border border-gray-200 print:border-none print:shadow-none min-h-[500px]">
                <div className="text-center mb-10 border-b-2 border-[#1c2541] pb-6">
                    <h1 className="text-4xl font-bold font-serif text-[#1c2541] mb-2">{config?.name}</h1>
                    <p className="text-lg text-[#8a9a5b] font-medium tracking-wide">
                        {config?.startDate && format(parseISO(config.startDate), 'MMMM do, yyyy')} —{' '}
                        {config?.endDate && format(parseISO(config.endDate), 'MMMM do, yyyy')}
                    </p>
                    {currentPnr && (
                        <p className="text-sm text-[#6b7280] mt-1 font-mono tracking-wider">
                            Trip Code: {currentPnr}
                        </p>
                    )}
                </div>

                <div className="space-y-12">
                    {days.length === 0 && (
                        <p className="text-center text-gray-400">Please configure your trip dates first.</p>
                    )}

                    {days.map((date) => {
                        const dayStr = format(date, 'yyyy-MM-dd');
                        const displayDate = format(date, 'EEEE, MMMM do');
                        const dayBlocks = blocks
                            .filter((b) => b.dayId === dayStr)
                            .sort((a, b) => a.order - b.order);

                        if (dayBlocks.length === 0) return null; // Skip empty days in print view

                        return (
                            <div key={dayStr} className="page-break-inside-avoid">
                                <h3 className="text-2xl font-bold text-[#1c2541] border-b border-gray-200 pb-2 mb-4 bg-gray-50/50 print:bg-transparent inline-block w-full">
                                    {displayDate}
                                </h3>

                                <div className="space-y-4">
                                    {dayBlocks.map((block) => (
                                        <div key={block.id} className="flex gap-4 border-l-4 border-gray-200 pl-4 py-1 page-break-inside-avoid">
                                            <div className="w-24 shrink-0 text-sm font-bold text-[#8a9a5b]">
                                                {block.startTime || '--:--'}
                                                {block.endTime && <div className="text-xs text-gray-400 font-normal">to {block.endTime}</div>}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-white bg-[#1c2541] px-2 py-0.5 rounded">
                                                        {block.type}
                                                    </span>
                                                    <h4 className="text-lg font-bold text-[#2c2c2c]">{block.title}</h4>
                                                </div>

                                                {/* The detailed-info class is hooked to Mode A/Mode B CSS */}
                                                <div className="detailed-info">
                                                    {block.details && (
                                                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed break-words bg-gray-50 print:bg-transparent p-3 print:p-0 rounded border border-gray-100 print:border-none">
                                                            {block.details}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PrintLayout;

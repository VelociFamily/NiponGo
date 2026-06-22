import React, { useState, useEffect } from 'react';
import { useTripStore, getLastPnr } from '../store/useTripStore';
import { normalizePnr } from '../lib/pnr';
import { Plane, Plus, LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface TripLobbyProps {
    onCreateNew: () => void;
}

const TripLobby: React.FC<TripLobbyProps> = ({ onCreateNew }) => {
    const { loadTrip, isLoading, connectionError, clearError } = useTripStore();
    const [pnrInput, setPnrInput] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [lastPnr] = useState<string | null>(() => getLastPnr());
    const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);

    // Auto-load last used trip
    useEffect(() => {
        if (lastPnr && !autoLoadAttempted) {
            setAutoLoadAttempted(true);
            loadTrip(lastPnr);
        }
    }, [lastPnr, autoLoadAttempted, loadTrip]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);
        clearError();

        const normalized = normalizePnr(pnrInput);
        if (!normalized) {
            setValidationError('Please enter a valid 6-character trip code (letters and numbers only).');
            return;
        }

        loadTrip(normalized);
    };

    const handleRejoin = () => {
        if (lastPnr) {
            clearError();
            loadTrip(lastPnr);
        }
    };

    // While auto-loading, show a clean loading state
    if (isLoading && lastPnr && !connectionError) {
        return (
            <div className="min-h-screen bg-seigaiha bg-[#f5f5f3] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#8a9a5b] animate-spin mx-auto mb-4" />
                    <p className="text-[#6b7280] text-lg">Loading trip <span className="font-mono font-bold text-[#1c2541]">{lastPnr}</span>...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-seigaiha bg-[#f5f5f3] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-3">
                        <span className="text-4xl">⛩️</span>
                    </div>
                    <h1 className="text-4xl font-bold text-[#1c2541] tracking-tight font-serif">NipponGo</h1>
                    <p className="text-[#6b7280] mt-2">Plan your Japan adventure together</p>
                </div>

                {/* Error Banner */}
                {(connectionError || validationError) && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-red-700">{connectionError || validationError}</p>
                        </div>
                    </div>
                )}

                {/* Join Trip Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <LogIn size={20} className="text-[#8a9a5b]" />
                        <h2 className="text-lg font-bold text-[#1c2541]">Join a Trip</h2>
                    </div>
                    <p className="text-sm text-[#6b7280] mb-4">
                        Enter the 6-character trip code shared by your family.
                    </p>
                    <form onSubmit={handleJoin} className="flex gap-2">
                        <input
                            type="text"
                            value={pnrInput}
                            onChange={(e) => {
                                setPnrInput(e.target.value.toUpperCase());
                                setValidationError(null);
                            }}
                            placeholder="e.g. K7X3M2"
                            maxLength={6}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8a9a5b] focus:border-transparent outline-none transition-all text-center font-mono text-lg tracking-[0.3em] uppercase"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || pnrInput.length === 0}
                            className="px-5 py-2.5 bg-[#8a9a5b] hover:bg-[#728247] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plane size={16} />
                            )}
                            Join
                        </button>
                    </form>

                    {/* Quick rejoin for last used trip */}
                    {lastPnr && (
                        <button
                            onClick={handleRejoin}
                            disabled={isLoading}
                            className="w-full mt-3 px-4 py-2 text-sm text-[#8a9a5b] hover:text-[#728247] hover:bg-[#8a9a5b]/10 rounded-lg transition-colors text-center disabled:opacity-50"
                        >
                            Rejoin last trip: <span className="font-mono font-bold tracking-wider">{lastPnr}</span>
                        </button>
                    )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="text-sm text-[#6b7280] font-medium">or</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* Create Trip Card */}
                <button
                    onClick={onCreateNew}
                    disabled={isLoading}
                    className="w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-md hover:border-[#8a9a5b]/30 transition-all group disabled:opacity-50"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#8a9a5b]/10 flex items-center justify-center group-hover:bg-[#8a9a5b]/20 transition-colors">
                            <Plus size={22} className="text-[#8a9a5b]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#1c2541]">Create New Trip</h2>
                            <p className="text-sm text-[#6b7280]">Start a new itinerary and get a trip code to share.</p>
                        </div>
                    </div>
                </button>

                {/* Footer */}
                <p className="text-center text-xs text-[#6b7280]/60 mt-8">
                    Powered by real-time sync — changes appear instantly for everyone.
                </p>
            </div>
        </div>
    );
};

export default TripLobby;

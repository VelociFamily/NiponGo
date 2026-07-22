import React, { useState, useEffect } from 'react';
import { useTripStore } from './store/useTripStore';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { Settings, Map, Wallet, Printer, Plane, Copy, Check, LogOut, AlertCircle, X } from 'lucide-react';

import TripLobby from './components/TripLobby';
import ConfigForm from './components/ConfigForm';
import ItineraryView from './components/Itinerary/ItineraryView';
import BudgetDashboard from './components/Budget/BudgetDashboard';
import PrintLayout from './components/Print/PrintLayout';
import FlightDashboard from './components/Flights/FlightDashboard';

type Tab = 'config' | 'flights' | 'itinerary' | 'budget' | 'print';

function App() {
  const config = useTripStore((state) => state.config);
  const tripId = useTripStore((state) => state.tripId);
  const currentPnr = useTripStore((state) => state.currentPnr);
  const connectionError = useTripStore((state) => state.connectionError);
  const clearError = useTripStore((state) => state.clearError);
  const leaveTrip = useTripStore((state) => state.leaveTrip);

  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pnrCopied, setPnrCopied] = useState(false);

  // Activate real-time sync when a trip is loaded
  useRealtimeSync();

  // If there's no config (first load or cleared), force the config tab
  useEffect(() => {
    if (!config) {
      setActiveTab('config');
    } else if (activeTab === 'config' && config) {
      // If we just saved the config, default to itinerary view
      setActiveTab('itinerary');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!config]);

  const displayCurrency = useTripStore((state) => state.displayCurrency);
  const setDisplayCurrency = useTripStore((state) => state.setDisplayCurrency);

  const handleCopyPnr = async () => {
    if (!currentPnr) return;
    try {
      await navigator.clipboard.writeText(currentPnr);
      setPnrCopied(true);
      setTimeout(() => setPnrCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
    }
  };

  const handleLeaveTrip = () => {
    setShowCreateForm(false);
    leaveTrip();
  };

  // ---- No trip loaded: show lobby or create form ----
  if (!tripId) {
    if (showCreateForm) {
      // Show the config form for creating a new trip
      return (
        <div className="min-h-screen bg-seigaiha text-[#2c2c2c] bg-[#f5f5f3]">
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-2">
                  <span className="text-2xl pt-1">⛩️</span>
                  <h1 className="text-xl font-bold text-[#1c2541] tracking-tight">NipponGo</h1>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-sm text-[#6b7280] hover:text-[#1c2541] transition-colors flex items-center gap-1"
                >
                  ← Back
                </button>
              </div>
            </div>
          </header>
          <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ConfigForm />
          </main>
        </div>
      );
    }

    return <TripLobby onCreateNew={() => setShowCreateForm(true)} />;
  }

  // ---- Trip loaded: show main app ----

  const renderContent = () => {
    if (!config) {
      return <ConfigForm />;
    }

    switch (activeTab) {
      case 'config':
        return <ConfigForm />;
      case 'flights':
        return <FlightDashboard />;
      case 'itinerary':
        return <ItineraryView />;
      case 'budget':
        return <BudgetDashboard />;
      case 'print':
        return <PrintLayout />;
      default:
        return <ConfigForm />;
    }
  };

  return (
    <div className="min-h-screen bg-seigaiha text-[#2c2c2c] bg-[#f5f5f3]">
      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{connectionError}</p>
          </div>
          <button onClick={clearError} className="text-red-400 hover:text-red-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl pt-1">⛩️</span>
              <h1 className="text-xl font-bold text-[#1c2541] tracking-tight">
                {config ? config.name : 'NipponGo'}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* PNR Badge */}
              {currentPnr && (
                <button
                  onClick={handleCopyPnr}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2541]/5 hover:bg-[#1c2541]/10 rounded-lg transition-colors group"
                  title="Click to copy trip code"
                >
                  <span className="text-xs text-[#6b7280] font-medium">Trip Code:</span>
                  <span className="font-mono font-bold text-[#1c2541] tracking-wider text-sm">{currentPnr}</span>
                  {pnrCopied ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} className="text-[#6b7280] group-hover:text-[#1c2541] transition-colors" />
                  )}
                </button>
              )}

              {/* Currency Selector */}
              {config && (
                <div className="flex items-center gap-1 bg-[#1c2541]/5 hover:bg-[#1c2541]/10 rounded-lg px-2.5 py-1.5 border border-gray-200/40 shadow-sm transition-all">
                  <span className="text-xs text-[#6b7280] font-medium select-none hidden xs:inline">Currency:</span>
                  <select
                    value={displayCurrency}
                    onChange={(e) => setDisplayCurrency(e.target.value as 'USD' | 'JPY')}
                    className="bg-transparent text-xs font-bold text-[#1c2541] outline-none cursor-pointer"
                  >
                    <option value="JPY">¥ JPY</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>
              )}

              {/* Leave Trip */}
              <button
                onClick={handleLeaveTrip}
                className="flex items-center gap-1 px-2 py-1.5 text-[#6b7280] hover:text-red-500 rounded-md transition-colors text-sm"
                title="Leave trip"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Leave</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          {config && (
            <div className="flex justify-center -mb-px">
              <nav className="flex space-x-1 sm:space-x-4 pb-2">
                <TabButton
                  active={activeTab === 'config'}
                  onClick={() => setActiveTab('config')}
                  icon={<Settings size={18} />}
                  label="Config"
                />
                <TabButton
                  active={activeTab === 'flights'}
                  onClick={() => setActiveTab('flights')}
                  icon={<Plane size={18} />}
                  label="Flights"
                />
                <TabButton
                  active={activeTab === 'itinerary'}
                  onClick={() => setActiveTab('itinerary')}
                  icon={<Map size={18} />}
                  label="Itinerary"
                />
                <TabButton
                  active={activeTab === 'budget'}
                  onClick={() => setActiveTab('budget')}
                  icon={<Wallet size={18} />}
                  label="Budget"
                />
                <TabButton
                  active={activeTab === 'print'}
                  onClick={() => setActiveTab('print')}
                  icon={<Printer size={18} />}
                  label="Export"
                />
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out
        ${active
          ? 'bg-[#e5e7eb]/60 text-[#1c2541] border border-gray-300/50 shadow-sm'
          : 'text-gray-600 hover:text-[#1c2541] hover:bg-white/60'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default App;

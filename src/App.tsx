import React, { useState, useEffect } from 'react';
import { useTripStore } from './store/useTripStore';
import { Settings, Map, Wallet, Printer, Plane } from 'lucide-react';

import ConfigForm from './components/ConfigForm';
import ItineraryView from './components/Itinerary/ItineraryView';
import BudgetDashboard from './components/Budget/BudgetDashboard';
import PrintLayout from './components/Print/PrintLayout';
import FlightDashboard from './components/Flights/FlightDashboard';

type Tab = 'config' | 'flights' | 'itinerary' | 'budget' | 'print';

function App() {
  const config = useTripStore((state) => state.config);
  const [activeTab, setActiveTab] = useState<Tab>('config');

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
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl pt-1">⛩️</span>
              <h1 className="text-xl font-bold text-[#1c2541] tracking-tight">
                {config ? config.name : 'NipponGo'}
              </h1>
            </div>

            {config && (
              <nav className="flex space-x-1 sm:space-x-4">
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
            )}
          </div>
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

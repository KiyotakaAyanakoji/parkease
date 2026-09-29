import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Car, User, Settings, LogOut, Menu } from 'lucide-react';

import RoleSelection from './screens/RoleSelection';
import DriverDashboard from './screens/DriverDashboard';
import ParkingDetails from './screens/ParkingDetails';
import ReservationForm from './screens/ReservationForm';
import BookingConfirmation from './screens/BookingConfirmation';
import MyBookings from './screens/MyBookings';

import OperatorDashboard from './screens/OperatorDashboard';
import OperatorVerification from './screens/OperatorVerification';
import CheckoutReceipt from './screens/CheckoutReceipt';
import ArrivalManagement from './screens/ArrivalManagement';

const ScreenManager = () => {
  const { currentScreen, role, setRole, navigate } = useAppContext();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'RoleSelection': return <RoleSelection />;
      case 'DriverDashboard': return <DriverDashboard />;
      case 'ParkingDetails': return <ParkingDetails />;
      case 'ReservationForm': return <ReservationForm />;
      case 'BookingConfirmation': return <BookingConfirmation />;
      case 'MyBookings': return <MyBookings />;
      
      case 'OperatorDashboard': return <OperatorDashboard />;
      case 'OperatorVerification': return <OperatorVerification />;
      case 'CheckoutReceipt': return <CheckoutReceipt />;
      case 'ArrivalManagement': return <ArrivalManagement />;
      default: return <RoleSelection />;
    }
  };

  const handleLogout = () => {
    setRole(null);
    navigate('RoleSelection');
  };

  if (!role || currentScreen === 'RoleSelection') {
    return <div className="app-container fade-in">{renderScreen()}</div>;
  }

  return (
    <div className="app-container authenticated fade-in">
      <aside className="sidebar">
        <div className="flex items-center gap-2 mb-6 text-xl font-semibold">
          <Car size={24} className="text-mint" />
          <span>ParkEase</span>
        </div>
        
        <nav className="flex flex-col gap-2 mt-4 flex-1">
          {role === 'driver' ? (
            <>
              <button 
                onClick={() => navigate('DriverDashboard')}
                className={`btn ${currentScreen === 'DriverDashboard' ? 'btn-primary' : 'btn-ghost text-white'}`}
                style={{justifyContent: 'flex-start'}}
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('MyBookings')}
                className={`btn ${currentScreen === 'MyBookings' ? 'btn-primary' : 'btn-ghost text-white'}`}
                style={{justifyContent: 'flex-start'}}
              >
                My Bookings
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('OperatorDashboard')}
                className={`btn ${currentScreen === 'OperatorDashboard' ? 'btn-primary' : 'btn-ghost text-white'}`}
                style={{justifyContent: 'flex-start'}}
              >
                Overview
              </button>
              <button 
                onClick={() => navigate('OperatorVerification')}
                className={`btn ${currentScreen === 'OperatorVerification' ? 'btn-primary' : 'btn-ghost text-white'}`}
                style={{justifyContent: 'flex-start'}}
              >
                Verify & Check-in
              </button>
              <button 
                onClick={() => navigate('ArrivalManagement')}
                className={`btn ${currentScreen === 'ArrivalManagement' ? 'btn-primary' : 'btn-ghost text-white'}`}
                style={{justifyContent: 'flex-start'}}
              >
                Arrival Management
              </button>
            </>
          )}
        </nav>
        
        <div className="mt-auto">
          <button 
            onClick={handleLogout}
            className="btn btn-ghost text-white w-full"
            style={{justifyContent: 'flex-start'}}
          >
            <LogOut size={18} />
            Reset Demo
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="top-bar">
          <div className="flex items-center gap-4">
            <button className="btn btn-ghost p-2" style={{display: 'md:none'}}>
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-forest hidden md:block">
              {role === 'driver' ? 'Driver Portal' : 'Operator Portal'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center text-primary font-semibold">
              <User size={16} />
            </div>
            <span className="text-sm font-medium hidden md:block">
              {role === 'driver' ? 'Demo Driver' : 'Demo Operator'}
            </span>
          </div>
        </header>
        
        <main className="main-content">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ScreenManager />
    </AppProvider>
  );
}

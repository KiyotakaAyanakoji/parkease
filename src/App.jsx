import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Car, User, LogOut, Menu, X, Compass, Bookmark, LayoutGrid, MapPin, Activity, DollarSign, Database, Shield, Zap, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Login from './screens/Login';
import Signup from './screens/Signup';
import DriverDashboard from './screens/DriverDashboard';
import ParkingDetails from './screens/ParkingDetails';
import ReservationForm from './screens/ReservationForm';
import BookingConfirmation from './screens/BookingConfirmation';
import MyBookings from './screens/MyBookings';
import MyVehicles from './screens/MyVehicles';

import OperatorDashboard from './screens/OperatorDashboard';
import OperatorFacilities from './screens/OperatorFacilities';
import OperatorActivityLogs from './screens/OperatorActivityLogs';
import OperatorPricing from './screens/OperatorPricing';
import AdminDashboard from './screens/AdminDashboard';
import AdminFacilities from './screens/AdminFacilities';
import AdminSlots from './screens/AdminSlots';
import AdminOperators from './screens/AdminOperators';
import AdminPricing from './screens/AdminPricing';
import LandingPage from './screens/LandingPage';

const ScreenManager = () => {
  const { currentScreen, role, setRole, navigate, authLoading, user, setUser } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LandingPage': return <LandingPage />;
      case 'Login': return <Login />;
      case 'Signup': return <Signup />;
      case 'DriverDashboard': return <DriverDashboard />;
      case 'ParkingDetails': return <ParkingDetails />;
      case 'ReservationForm': return <ReservationForm />;
      case 'BookingConfirmation': return <BookingConfirmation />;
      case 'MyBookings': return <MyBookings />;
      case 'MyVehicles': return <MyVehicles />;
      
      case 'OperatorDashboard': return <OperatorDashboard />;
      case 'OperatorFacilities': return <OperatorFacilities />;
      case 'OperatorActivityLogs': return <OperatorActivityLogs />;
      case 'OperatorPricing': return <OperatorPricing />;
      case 'AdminDashboard': return <AdminDashboard />;
      case 'AdminFacilities': return <AdminFacilities />;
      case 'AdminSlots': return <AdminSlots />;
      case 'AdminOperators': return <AdminOperators />;
      case 'AdminPricing': return <AdminPricing />;
      default: return <LandingPage />;
    }
  };

  const handleLogout = async () => {
    try {
      const { authService } = await import('./services/authService');
      await authService.logout();
    } catch(e) {
      console.error(e);
    }
    setRole(null);
    setUser(null);
    navigate('LandingPage');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-offwhite text-forest">
        <div className="animate-pulse flex flex-col items-center">
          <Car size={32} className="text-primary mb-4" />
          <p className="font-semibold tracking-widest uppercase text-xs text-muted">Loading ParkEase</p>
        </div>
      </div>
    );
  }

  if (!role || currentScreen === 'Login' || currentScreen === 'Signup' || currentScreen === 'LandingPage') {
    return <div className="min-h-screen bg-offwhite">{renderScreen()}</div>;
  }

  // --- DRIVER NAVIGATION (Consumer App Aesthetic) ---
  if (role === 'DRIVER') {
    return (
      <div className="min-h-screen bg-offwhite flex flex-col font-sans">
        <header className="bg-white border-b border-border sticky top-0 z-50">
          <div className="layout-container h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('DriverDashboard')}>
              <Car size={28} className="text-primary" />
              <span className="text-xl font-bold tracking-tight text-forest">ParkEase</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => navigate('DriverDashboard')}
                className={`font-medium transition-colors ${currentScreen === 'DriverDashboard' || currentScreen === 'ParkingDetails' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted hover:text-forest'}`}
              >
                Find Parking
              </button>
              <button 
                onClick={() => navigate('MyBookings')}
                className={`font-medium transition-colors ${currentScreen === 'MyBookings' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted hover:text-forest'}`}
              >
                My Passes
              </button>
              <button 
                onClick={() => navigate('MyVehicles')}
                className={`font-medium transition-colors ${currentScreen === 'MyVehicles' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted hover:text-forest'}`}
              >
                My Vehicles
              </button>
            </nav>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm font-semibold text-charcoal">{user?.name}</span>
                <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center text-primary font-bold cursor-pointer" onClick={handleLogout}>
                  {user?.name?.[0] || <User size={18} />}
                </div>
              </div>
              <button className="md:hidden text-forest" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-border overflow-hidden absolute top-20 left-0 right-0 z-40 shadow-xl"
            >
              <div className="flex flex-col p-4 gap-4">
                <button onClick={() => { navigate('DriverDashboard'); setMobileMenuOpen(false); }} className="text-left font-semibold text-lg py-2 border-b border-border">Find Parking</button>
                <button onClick={() => { navigate('MyBookings'); setMobileMenuOpen(false); }} className="text-left font-semibold text-lg py-2 border-b border-border">My Passes</button>
                <button onClick={() => { navigate('MyVehicles'); setMobileMenuOpen(false); }} className="text-left font-semibold text-lg py-2 border-b border-border">My Vehicles</button>
                <button onClick={handleLogout} className="text-left font-semibold text-lg py-2 text-red-500">Sign Out</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // --- ADMIN & OPERATOR NAVIGATION (Professional / Intelligence Aesthetic) ---
  const navItems = role === 'ADMIN' ? [
    { id: 'AdminDashboard', label: 'Network Intelligence', icon: Zap },
    { id: 'AdminFacilities', label: 'Facilities', icon: Building },
    { id: 'AdminSlots', label: 'Parking Slots', icon: LayoutGrid },
    { id: 'AdminOperators', label: 'Operators', icon: Shield },
    { id: 'AdminPricing', label: 'Pricing Rules', icon: DollarSign },
  ] : [
    { id: 'OperatorDashboard', label: 'Live Cockpit', icon: Activity },
    { id: 'OperatorFacilities', label: 'My Facilities', icon: Building },
    { id: 'OperatorPricing', label: 'Pricing Engine', icon: DollarSign },
    { id: 'OperatorActivityLogs', label: 'Activity Logs', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-offwhite flex font-sans overflow-hidden">
      {/* Sleek Sidebar */}
      <aside className="w-64 bg-forest text-white hidden md:flex flex-col border-r border-forest">
        <div className="h-20 flex items-center px-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg"><Car size={20} className="text-white" /></div>
            <span className="text-xl font-bold tracking-wide">ParkEase</span>
          </div>
        </div>
        
        <div className="px-8 py-6">
          <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">
            {role === 'ADMIN' ? 'Admin Console' : 'Operations'}
          </p>
          <nav className="flex flex-col gap-1">
            {navItems.map(item => {
              const isActive = currentScreen === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                  <item.icon size={18} className={isActive ? 'text-primary' : 'text-white/40'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
              {user?.name?.[0]}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold">{user?.name}</span>
              <span className="text-xs text-white/40 uppercase tracking-wider">{role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-red-400 transition-colors w-full"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-border px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car size={24} className="text-primary" />
            <span className="font-bold text-forest">ParkEase {role === 'ADMIN' ? 'Admin' : 'Ops'}</span>
          </div>
          <button className="text-forest" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="md:hidden bg-forest text-white border-b border-white/10 overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-2">
                {navItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => { navigate(item.id); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/5"
                  >
                    <item.icon size={18} className="text-primary" />
                    {item.label}
                  </button>
                ))}
                <button onClick={handleLogout} className="flex items-center gap-3 py-3 px-4 text-red-400 mt-2">
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto bg-offwhite">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
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

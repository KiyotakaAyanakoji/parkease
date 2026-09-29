import React, { createContext, useContext, useState, useEffect } from 'react';

const initialParkingLots = [
  {
    id: 'lot-1',
    name: 'Central Plaza Parking',
    area: 'Dadar, Mumbai',
    pricePerHour: 50,
    description: 'Secure underground parking at Central Plaza. 24/7 access.',
  },
  {
    id: 'lot-2',
    name: 'Metro Point Parking',
    area: 'Andheri, Mumbai',
    pricePerHour: 40,
    description: 'Open-air parking next to the metro station.',
  },
  {
    id: 'lot-3',
    name: 'City Centre Parking',
    area: 'Lower Parel, Mumbai',
    pricePerHour: 80,
    description: 'Premium valet parking service for City Centre mall.',
  },
];

const generateSlots = (lotId, count) => {
  const slots = [];
  const rows = ['A', 'B', 'C'];
  for (let i = 0; i < count; i++) {
    const row = rows[Math.floor(i / 10) % 3];
    const num = String((i % 10) + 1).padStart(2, '0');
    slots.push({ id: `${lotId}-slot-${i}`, lotId, label: `${row}${num}`, status: 'available' }); // available, occupied, reserved
  }
  return slots;
};

const initialSlots = [
  ...generateSlots('lot-1', 20),
  ...generateSlots('lot-2', 15),
  ...generateSlots('lot-3', 10),
];

const initialBookings = [
  {
    id: 'BKG-DEMO-1',
    lotId: 'lot-1',
    slotId: 'lot-1-slot-0',
    vehicle: 'MH-01-AB-1234',
    expectedArrival: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    duration: 2,
    status: 'awaiting-response', // awaiting-response, confirmed-late, released, checked-in, completed, cancelled, reserved
    price: 100,
    driverName: 'Demo Driver'
  }
];

// Mark initial slots based on initial bookings
const initializeSlots = (slots, bookings) => {
  return slots.map(slot => {
    const booking = bookings.find(b => b.slotId === slot.id && ['reserved', 'checked-in', 'awaiting-response', 'confirmed-late'].includes(b.status));
    if (booking) {
      return { ...slot, status: booking.status === 'checked-in' ? 'occupied' : 'reserved' };
    }
    return slot;
  });
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [role, setRole] = useState(null); // 'driver', 'operator'
  const [currentScreen, setCurrentScreen] = useState('LandingPage');
  const [screenProps, setScreenProps] = useState({});
  
  const [parkingLots] = useState(initialParkingLots);
  const [slots, setSlots] = useState(initializeSlots(initialSlots, initialBookings));
  const [bookings, setBookings] = useState(initialBookings);

  const navigate = (screenName, props = {}) => {
    setCurrentScreen(screenName);
    setScreenProps(props);
    window.scrollTo(0, 0);
  };

  const createBooking = (bookingData) => {
    const newBooking = {
      ...bookingData,
      id: `BKG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: 'reserved'
    };
    
    setBookings(prev => [newBooking, ...prev]);
    setSlots(prev => prev.map(s => s.id === bookingData.slotId ? { ...s, status: 'reserved' } : s));
    
    return newBooking;
  };

  const updateBookingStatus = (bookingId, newStatus) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      if (newStatus === 'cancelled' || newStatus === 'completed' || newStatus === 'released') {
        setSlots(prev => prev.map(s => s.id === booking.slotId ? { ...s, status: 'available' } : s));
      } else if (newStatus === 'checked-in') {
        setSlots(prev => prev.map(s => s.id === booking.slotId ? { ...s, status: 'occupied' } : s));
      }
    }
  };

  return (
    <AppContext.Provider value={{
      role, setRole,
      currentScreen, navigate, screenProps,
      parkingLots, slots, bookings,
      createBooking, updateBookingStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

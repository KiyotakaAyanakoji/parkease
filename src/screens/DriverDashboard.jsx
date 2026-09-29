import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MapPin, Clock, Search, Navigation } from 'lucide-react';

export default function DriverDashboard() {
  const { parkingLots, navigate, slots, bookings } = useAppContext();
  const [search, setSearch] = useState('');

  const filteredLots = parkingLots.filter(lot => 
    lot.name.toLowerCase().includes(search.toLowerCase()) || 
    lot.area.toLowerCase().includes(search.toLowerCase())
  );

  const getAvailability = (lotId) => {
    const lotSlots = slots.filter(s => s.lotId === lotId);
    const available = lotSlots.filter(s => s.status === 'available').length;
    return { available, total: lotSlots.length };
  };

  const activeBookings = bookings.filter(b => 
    ['reserved', 'checked-in', 'awaiting-response', 'confirmed-late'].includes(b.status)
  );

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-forest mb-2">Good evening</h2>
        <p className="text-muted">Find a space that works for your plans.</p>
      </div>

      <div className="bg-white border border-border rounded-xl p-2 mb-8 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-border">
          <Search className="text-primary" size={20} />
          <input 
            type="text" 
            placeholder="Search location..."
            className="w-full border-none outline-none text-charcoal bg-transparent placeholder-muted font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-border min-w-[180px]">
          <Clock className="text-primary" size={20} />
          <div className="flex flex-col">
            <span className="text-xs text-muted font-medium uppercase">Arriving</span>
            <span className="text-sm font-semibold text-charcoal">Today, 2:00 PM</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 min-w-[160px]">
          <Navigation className="text-primary" size={20} />
          <div className="flex flex-col">
            <span className="text-xs text-muted font-medium uppercase">Vehicle</span>
            <span className="text-sm font-semibold text-charcoal">MH-01-AB-1234</span>
          </div>
        </div>
      </div>

      {activeBookings.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-forest">Your Active Bookings</h3>
            <button className="btn btn-ghost" onClick={() => navigate('MyBookings')}>View All</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activeBookings.slice(0, 2).map(booking => {
              const lot = parkingLots.find(l => l.id === booking.lotId);
              return (
                <div key={booking.id} className="card card-interactive" onClick={() => navigate('MyBookings')}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="badge badge-success">{booking.status.replace('-', ' ')}</span>
                    <span className="font-semibold text-forest">{booking.id}</span>
                  </div>
                  <h4 className="font-semibold text-lg">{lot?.name}</h4>
                  <p className="text-muted text-sm mb-3">Slot: {slots.find(s => s.id === booking.slotId)?.label || booking.slotId}</p>
                  <div className="flex items-center gap-2 text-sm text-forest bg-mint p-2 rounded-md">
                    <Clock size={16} />
                    <span>Expected: {new Date(booking.expectedArrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-forest mb-4">Available near you</h3>
        <span className="text-xs text-muted mb-4 block">Note: Sample prototype data (Mumbai)</span>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLots.map(lot => {
            const { available, total } = getAvailability(lot.id);
            return (
              <div key={lot.id} className="card flex flex-col">
                <div className="mb-4 flex-1">
                  <h4 className="font-semibold text-lg text-forest mb-1">{lot.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-muted mb-3">
                    <MapPin size={14} />
                    <span>{lot.area}</span>
                  </div>
                  <div className="flex justify-between items-center bg-offwhite p-3 rounded-md mb-2">
                    <div>
                      <span className="block text-xs text-muted">Availability</span>
                      <span className="font-semibold text-forest">{available} <span className="text-sm font-normal text-muted">/ {total} slots</span></span>
                    </div>
                    <div>
                      <span className="block text-xs text-muted">Price</span>
                      <span className="font-semibold text-forest">₹{lot.pricePerHour}<span className="text-sm font-normal text-muted">/hr</span></span>
                    </div>
                  </div>
                </div>
                <button 
                  className="btn btn-outline w-full"
                  onClick={() => navigate('ParkingDetails', { lotId: lot.id })}
                >
                  View Parking
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

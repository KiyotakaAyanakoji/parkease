import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { MapPin, Clock, Search, Navigation } from 'lucide-react';

export default function DriverDashboard() {
  const { navigate } = useAppContext();
  const [search, setSearch] = useState('');
  
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const opts = { credentials: 'include' };
        const [facRes, bookRes] = await Promise.all([
          fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/driver/facilities', opts),
          fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/driver/bookings', opts)
        ]);

        if (facRes.ok) setFacilities(await facRes.json());
        if (bookRes.ok) setBookings(await bookRes.json());
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredFacilities = facilities.filter(fac => 
    fac.name.toLowerCase().includes(search.toLowerCase()) || 
    fac.area.toLowerCase().includes(search.toLowerCase())
  );

  const activeBookings = bookings.filter(b => 
    ['RESERVED', 'CHECKED_IN'].includes(b.status)
  );

  if (loading) return <div className="p-8 text-forest">Loading...</div>;

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-forest mb-2">Good evening</h2>
        <p className="text-muted">Find a space that works for your plans.</p>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

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
            <span className="text-sm font-semibold text-charcoal">Today, Soon</span>
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
              return (
                <div key={booking.id} className="card card-interactive" onClick={() => navigate('MyBookings')}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="badge badge-success">{booking.status.replace('_', ' ')}</span>
                    <span className="font-semibold text-forest">{booking.id}</span>
                  </div>
                  <h4 className="font-semibold text-lg">{booking.facility_name}</h4>
                  <p className="text-muted text-sm mb-3">Slot: {booking.slot_code}</p>
                  <div className="flex items-center gap-2 text-sm text-forest bg-mint p-2 rounded-md">
                    <Clock size={16} />
                    <span>Expected: {new Date(booking.expected_arrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-forest mb-4">Available near you</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFacilities.length === 0 ? (
            <div className="text-muted">No facilities found.</div>
          ) : (
            filteredFacilities.map(fac => {
              return (
                <div key={fac.id} className="card flex flex-col">
                  <div className="mb-4 flex-1">
                    <h4 className="font-semibold text-lg text-forest mb-1">{fac.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted mb-3">
                      <MapPin size={14} />
                      <span>{fac.area}</span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline w-full"
                    onClick={() => navigate('ParkingDetails', { facilityId: fac.id })}
                  >
                    View Parking
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

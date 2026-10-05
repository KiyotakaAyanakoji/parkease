import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { MapPin, Clock, Search, Navigation, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DriverDashboard() {
  const { navigate, user } = useAppContext();
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
          fetch(import.meta.env.VITE_API_BASE_URL + '/driver/facilities', opts),
          fetch(import.meta.env.VITE_API_BASE_URL + '/driver/bookings', opts)
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-surface rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-surface rounded-full"></div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="layout-container pb-12"
    >
      <header className="mb-12 mt-4">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted font-medium mb-1">
          Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {user?.name?.split(' ')[0] || 'Driver'}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl md-text-5xl font-bold tracking-tight text-forest mb-8">
          Where are you parking today?
        </motion.h1>

        {/* Unified Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-border p-2 flex items-center transition-all focus-within:shadow-md focus-within:border-green"
        >
          <div className="flex-1 flex items-center px-4 gap-3">
            <Search className="text-muted" size={24} />
            <input 
              type="text" 
              placeholder="Search destination or facility..."
              className="w-full py-4 text-lg border-none outline-none bg-transparent placeholder-muted text-forest font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary px-8 py-4 rounded-xl hidden md:flex">
            Find Parking
          </button>
        </motion.div>
      </header>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 font-medium">{error}</div>}

      {/* Primary Discovery Section */}
      <section>
        <div className="flex justify-between items-end mb-6 border-b border-border pb-2">
          <h2 className="text-sm font-bold tracking-widest uppercase text-muted">Available Facilities</h2>
        </div>
        
        <div className="flex flex-col gap-4">
          {filteredFacilities.length === 0 ? (
            <div className="py-12 text-center text-muted">No facilities match your search.</div>
          ) : (
            filteredFacilities.map((fac, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.3 }}
                key={fac.id} 
                className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                onClick={() => navigate('ParkingDetails', { facilityId: fac.id })}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-forest">{fac.name}</h3>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  </div>
                  <p className="text-muted flex items-center gap-2 font-medium">
                    <MapPin size={16} /> {fac.area}
                  </p>
                </div>
                
                <div className="flex items-center gap-6 md:border-l md:border-border md:pl-6">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-primary tracking-tight">
                      {fac.available_slots || 0}
                    </span>
                    <span className="text-xs font-semibold uppercase text-muted tracking-wide">Spaces Open</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-surface group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Upcoming Arrival Section */}
      {activeBookings.length > 0 && (
        <section className="mt-16">
          <div className="flex justify-between items-end mb-6 border-b border-border pb-2">
            <h2 className="text-sm font-bold tracking-widest uppercase text-muted">Upcoming Arrival</h2>
            <button className="text-primary font-semibold text-sm hover:underline" onClick={() => navigate('MyBookings')}>View All</button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {activeBookings.slice(0, 2).map((booking, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                key={booking.id} 
                className="bg-forest text-white rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => navigate('MyBookings')}
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-3xl opacity-20 -mr-12 -mt-12"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-12">
                    <span className="bg-primary/20 text-bright px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/30">
                      {booking.status.replace('_', ' ')}
                    </span>
                    <span className="text-white/40 font-mono text-sm">{booking.id}</span>
                  </div>
                  
                  <div className="mb-2">
                    <h3 className="text-2xl font-bold mb-1">{booking.facility_name}</h3>
                    <p className="text-white/60 font-medium text-lg">Slot <span className="text-white font-bold">{booking.slot_code}</span></p>
                  </div>
                  
                  <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-4">
                    <Clock size={18} className="text-primary" />
                    <span className="font-semibold text-lg">
                      {new Date(booking.expected_arrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

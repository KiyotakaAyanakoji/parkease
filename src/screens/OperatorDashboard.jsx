import React, { useState, useEffect } from 'react';
import { Car, Clock, LogIn, LogOut, CheckCircle, Activity, ChevronRight, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';

export default function OperatorDashboard() {
  const { navigate, role, user } = useAppContext();
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, active_reservations: 0 });
  const [facilities, setFacilities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const opts = { credentials: 'include' };
      const [resOverview, resRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/operator/overview', opts),
        fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/operator/reservations', opts)
      ]);
      
      if (resOverview.ok && resRes.ok) {
        const overviewData = await resOverview.json();
        setStats(overviewData.stats);
        setFacilities(overviewData.facilities);
        setReservations(await resRes.json());
      } else {
        setError('Failed to load data. Are you assigned to a facility?');
      }
    } catch (e) {
      console.error(e);
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'OPERATOR') {
      navigate('Login');
      return;
    }
    fetchData();
    // Simulate live updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [role, navigate]);

  const handleAction = async (bookingId, action) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/operator/${action}/${bookingId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchData(); // refresh on success
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-surface rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-surface rounded-full"></div>
      </div>
    </div>
  );
  
  if (facilities.length === 0) return (
    <div className="max-w-3xl mx-auto mt-24 text-center">
      <h2 className="text-2xl font-bold text-forest mb-4">No Facilities Assigned</h2>
      <p className="text-muted">You are not currently assigned to operate any parking facilities. Please contact your administrator.</p>
    </div>
  );

  const activeFacility = facilities[0]; // For demo, assume primary facility is first

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="layout-container pb-24"
    >
      <header className="mb-12 mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-muted mb-3">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse"></span>
            LIVE OPERATIONS COCKPIT
          </motion.div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-4xl md-text-5xl font-bold tracking-tight text-forest mb-2">
            {activeFacility.name.toUpperCase()}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted font-medium flex items-center gap-2">
            <MapPin size={16} /> {activeFacility.area}
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-right">
          <p className="text-sm font-semibold uppercase text-muted">Operator</p>
          <p className="text-lg font-bold text-forest">{user?.name}</p>
        </motion.div>
      </header>

      {/* Primary Occupancy Visualizer */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-16"
      >
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-4">
              <span className="text-6xl font-bold text-forest tracking-tighter">
                {Math.round((stats.occupied / (stats.total || 1)) * 100)}<span className="text-3xl">%</span>
              </span>
              <div className="text-right">
                <span className="block text-xl font-bold text-forest">{stats.occupied} / {stats.total}</span>
                <span className="text-sm font-bold uppercase text-muted tracking-widest">Slots Occupied</span>
              </div>
            </div>
            <div className="h-4 w-full bg-surface rounded-full overflow-hidden flex">
              <div className="h-full bg-forest" style={{ width: `${(stats.occupied / (stats.total || 1)) * 100}%` }}></div>
              <div className="h-full bg-warning opacity-80" style={{ width: `${(stats.active_reservations / (stats.total || 1)) * 100}%` }}></div>
            </div>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-forest"></span><span className="text-sm font-semibold">Occupied ({stats.occupied})</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-warning"></span><span className="text-sm font-semibold">Reserved ({stats.active_reservations})</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-surface border border-muted"></span><span className="text-sm font-semibold text-muted">Available ({stats.available})</span></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <button onClick={() => navigate('OperatorFacilities')} className="p-6 bg-white border border-border rounded-2xl hover:border-primary transition-all group flex flex-col items-center justify-center min-w-[160px]">
              <Activity size={24} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm">Parking Floor</span>
            </button>
            <button onClick={() => navigate('OperatorPricing')} className="p-6 bg-white border border-border rounded-2xl hover:border-primary transition-all group flex flex-col items-center justify-center min-w-[160px]">
              <span className="text-xl font-bold text-forest mb-2 group-hover:text-primary transition-colors">₹</span>
              <span className="font-semibold text-sm">Live Pricing</span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* Live Arrivals Timeline */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
          <h2 className="text-2xl font-bold text-forest">Arriving Vehicles</h2>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {reservations.length} Active
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {reservations.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
              <p className="text-muted font-medium">No pending arrivals or active check-ins.</p>
            </div>
          ) : (
            reservations.map((r, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                key={r.id} 
                className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="text-center min-w-[80px]">
                    <span className="block text-2xl font-bold text-forest tracking-tighter">
                      {new Date(r.expected_arrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className="text-xs font-semibold uppercase text-muted">Arrival</span>
                  </div>
                  
                  <div className="h-12 w-px bg-border hidden md:block"></div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold tracking-tight bg-offwhite px-3 py-1 rounded-md border border-border">{r.vehicle_reg}</h3>
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${r.status === 'RESERVED' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-muted text-sm font-medium">Slot <span className="text-forest font-bold">{r.slot_code}</span> • Ref: {r.id.split('-').pop()}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-end">
                  {r.status === 'RESERVED' && (
                    <button onClick={() => handleAction(r.id, 'checkin')} className="btn btn-primary w-full md:w-auto px-8 shadow-md">
                      Check In
                    </button>
                  )}
                  {r.status === 'CHECKED_IN' && (
                    <button onClick={() => handleAction(r.id, 'checkout')} className="bg-forest text-white font-semibold py-3 px-8 rounded-full w-full md:w-auto hover:bg-charcoal transition-colors shadow-md">
                      Check Out
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}

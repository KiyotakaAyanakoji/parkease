import React, { useState, useEffect } from 'react';
import { Car, Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

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

  if (loading) return <div className="p-8 text-forest">Loading Operator Dashboard...</div>;
  if (facilities.length === 0) return <div className="p-8 text-red-600 font-bold">You are not assigned to any facilities. Please contact an admin.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-forest mb-2">Welcome, {user?.name}</h1>
      <p className="text-muted mb-8">Managing: {facilities.map(f => f.name).join(', ')}</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Total Capacity</p>
            <p className="text-3xl font-bold text-forest">{stats.total}</p>
          </div>
          <Car className="text-primary opacity-50" size={32} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Available</p>
            <p className="text-3xl font-bold text-mint">{stats.available}</p>
          </div>
          <CheckCircle className="text-mint opacity-50" size={32} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Occupied</p>
            <p className="text-3xl font-bold text-amber-500">{stats.occupied}</p>
          </div>
          <Car className="text-amber-500 opacity-50" size={32} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Active Bookings</p>
            <p className="text-3xl font-bold text-blue-500">{stats.active_reservations}</p>
          </div>
          <Clock className="text-blue-500 opacity-50" size={32} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-offwhite">
          <h2 className="font-semibold text-forest">Today's Reservations</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-sage text-forest text-sm">
            <tr>
              <th className="p-4 font-medium">Ref</th>
              <th className="p-4 font-medium">Vehicle</th>
              <th className="p-4 font-medium">Slot</th>
              <th className="p-4 font-medium">Arrival</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-muted">No reservations found for your facilities.</td></tr>
            ) : (
              reservations.map(r => (
                <tr key={r.id} className="border-t border-border hover:bg-offwhite">
                  <td className="p-4 font-medium text-xs">{r.id.split('-').pop()}</td>
                  <td className="p-4 font-bold">{r.vehicle_reg}</td>
                  <td className="p-4 text-muted">{r.slot_code}</td>
                  <td className="p-4 text-muted">{new Date(r.expected_arrival).toLocaleTimeString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${r.status === 'RESERVED' ? 'bg-blue-100 text-blue-800' : r.status === 'CHECKED_IN' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.status === 'RESERVED' && (
                      <button onClick={() => handleAction(r.id, 'checkin')} className="btn btn-primary text-xs flex gap-1 items-center px-3 py-1">
                        <LogIn size={14} /> Check In
                      </button>
                    )}
                    {r.status === 'CHECKED_IN' && (
                      <button onClick={() => handleAction(r.id, 'checkout')} className="bg-amber-500 text-white rounded-md text-xs font-medium flex gap-1 items-center px-3 py-2">
                        <LogOut size={14} /> Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

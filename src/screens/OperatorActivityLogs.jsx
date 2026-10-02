import React, { useState, useEffect } from 'react';
import { Activity, Clock, Download, Filter } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function OperatorActivityLogs() {
  const { navigate, role } = useAppContext();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    return {
      start_date: weekAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    };
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const qs = `?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`;
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + `/operator/activity${qs}`, {
        credentials: 'include'
      });
      if (res.ok) {
        setLogs(await res.json());
      } else {
        setError('Failed to load activity logs.');
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
    fetchLogs();
  }, [role, navigate, dateRange]);

  const handleExport = () => {
    const qs = `?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}&format=csv`;
    window.open((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + `/operator/activity${qs}`, '_blank');
  };

  if (loading && logs.length === 0) return <div className="p-8 text-forest">Loading Activity...</div>;
  if (error) return <div className="p-8 text-red-600 font-bold">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
          <Activity size={24} /> Operational Activity
        </h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white border border-border p-2 rounded-lg shadow-sm">
            <Filter size={16} className="text-muted" />
            <input type="date" className="auth-input py-1 text-sm border-none shadow-none h-8" value={dateRange.start_date} onChange={e => setDateRange({...dateRange, start_date: e.target.value})} />
            <span className="text-muted text-sm">to</span>
            <input type="date" className="auth-input py-1 text-sm border-none shadow-none h-8" value={dateRange.end_date} onChange={e => setDateRange({...dateRange, end_date: e.target.value})} />
          </div>
          
          <button onClick={handleExport} className="btn btn-primary btn-sm flex items-center gap-2 h-10 px-4 w-full sm:w-auto">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-sage text-forest text-sm">
            <tr>
              <th className="p-4 font-medium">Timestamp</th>
              <th className="p-4 font-medium">Event</th>
              <th className="p-4 font-medium">Booking Ref</th>
              <th className="p-4 font-medium">Facility</th>
              <th className="p-4 font-medium">Slot</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-muted">No activity recorded for this period.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="border-t border-border hover:bg-offwhite">
                  <td className="p-4 text-sm text-muted flex items-center gap-2">
                    <Clock size={14} /> {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 font-medium">
                    <span className={`px-2 py-1 text-xs rounded-full ${log.event_type === 'CHECK_IN' ? 'bg-blue-100 text-blue-800' : log.event_type === 'CHECK_OUT' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {log.event_type}
                    </span>
                  </td>
                  <td className="p-4 text-muted font-mono text-xs">{log.booking_id.split('-').pop()}</td>
                  <td className="p-4 text-forest">{log.facility_name}</td>
                  <td className="p-4 text-muted">{log.slot_code}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function OperatorActivityLogs() {
  const { navigate, role } = useAppContext();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/operator/activity', {
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
  }, [role, navigate]);

  if (loading) return <div className="p-8 text-forest">Loading Activity...</div>;
  if (error) return <div className="p-8 text-red-600 font-bold">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-forest flex items-center gap-2 mb-6">
        <Activity size={24} /> Operational Activity
      </h1>

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
              <tr><td colSpan="5" className="p-8 text-center text-muted">No activity recorded for your facilities.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="border-t border-border hover:bg-offwhite">
                  <td className="p-4 text-sm text-muted flex items-center gap-2">
                    <Clock size={14} /> {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 font-medium">
                    <span className={`px-2 py-1 text-xs rounded-full ${log.event_type === 'CHECK_IN' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
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

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Building, Hash, Users, MapPin, Search } from 'lucide-react';
import './Auth.css';

export default function AdminDashboard() {
  const { navigate, role } = useAppContext();
  const [stats, setStats] = useState({ total_facilities: 0, active_facilities: 0, total_slots: 0, total_operators: 0 });
  const [recentFacilities, setRecentFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'ADMIN') {
      navigate('Login');
      return;
    }

    const fetchOverview = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/admin/overview', {
          credentials: 'include'
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentFacilities(data.recent_facilities);
        } else if (res.status === 401 || res.status === 403) {
          navigate('Login');
        }
      } catch (e) {
        console.error('Failed to fetch admin overview', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOverview();
  }, [role, navigate]);

  if (loading) {
    return <div className="p-8 text-center text-forest">Loading Admin Data...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-forest mb-6">Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Facilities</p>
            <p className="text-3xl font-bold text-forest">{stats.total_facilities}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
            <Building size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Active Slots</p>
            <p className="text-3xl font-bold text-forest">{stats.total_slots}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
            <Hash size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Operators</p>
            <p className="text-3xl font-bold text-forest">{stats.total_operators}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
            <Users size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-offwhite">
          <h2 className="font-semibold text-forest">Recent Facilities</h2>
        </div>
        
        {recentFacilities.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <p>No facilities created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-sage text-forest text-sm">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Location</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Slots</th>
                </tr>
              </thead>
              <tbody>
                {recentFacilities.map((f, i) => (
                  <tr key={i} className="border-t border-border hover:bg-offwhite transition-colors">
                    <td className="p-4 font-medium">{f.name}</td>
                    <td className="p-4 flex items-center gap-2 text-muted">
                      <MapPin size={14} /> {f.area}, {f.city}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${f.status === 'ACTIVE' ? 'bg-mint text-primary' : 'bg-gray-100 text-gray-600'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted">{f.slot_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

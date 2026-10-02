import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Building, Hash, Users, MapPin, Calendar, Clock, BookMarked } from 'lucide-react';
import './Auth.css';

export default function AdminDashboard() {
  const { navigate, role } = useAppContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'ADMIN') {
      navigate('Login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/admin/analytics', {
          credentials: 'include'
        });
        
        if (res.ok) {
          setData(await res.json());
        } else if (res.status === 401 || res.status === 403) {
          navigate('Login');
        }
      } catch (e) {
        console.error('Failed to fetch admin analytics', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [role, navigate]);

  if (loading) {
    return <div className="p-8 text-center text-forest">Loading Analytics...</div>;
  }

  if (!data) return <div className="p-8 text-red-600">Failed to load analytics</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto fade-in">
      <h1 className="text-2xl font-bold text-forest mb-6">Admin Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Active Facilities</p>
            <p className="text-3xl font-bold text-forest">{data.active_facilities}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
            <Building size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Total Slots</p>
            <p className="text-3xl font-bold text-forest">{data.total_slots}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
            <Hash size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-forest">{data.total_bookings}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
            <BookMarked size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Active Bookings</p>
            <p className="text-3xl font-bold text-forest">{data.active_bookings}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Registered Drivers</p>
            <p className="text-3xl font-bold text-forest">{data.registered_drivers}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Confirmed Booking Value</p>
            <p className="text-3xl font-bold text-forest">₹{parseFloat(data.confirmed_booking_value || 0).toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
            <span className="text-xl font-bold">₹</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden p-6">
          <h2 className="font-semibold text-forest mb-4 text-lg">Slot Status Breakdown</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-offwhite p-4 rounded-lg text-center border border-border">
              <span className="block text-sm text-muted mb-1">Available</span>
              <span className="text-2xl font-bold text-forest">{data.slot_counts.AVAILABLE || 0}</span>
            </div>
            <div className="bg-offwhite p-4 rounded-lg text-center border border-border">
              <span className="block text-sm text-muted mb-1">Reserved</span>
              <span className="text-2xl font-bold text-primary">{data.slot_counts.RESERVED || 0}</span>
            </div>
            <div className="bg-offwhite p-4 rounded-lg text-center border border-border">
              <span className="block text-sm text-muted mb-1">Occupied</span>
              <span className="text-2xl font-bold text-charcoal">{data.slot_counts.OCCUPIED || 0}</span>
            </div>
            <div className="bg-offwhite p-4 rounded-lg text-center border border-border">
              <span className="block text-sm text-muted mb-1">Maintenance</span>
              <span className="text-2xl font-bold text-warning">{data.slot_counts.MAINTENANCE || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden p-6">
          <h2 className="font-semibold text-forest mb-4 text-lg">Booking Trends (Last 30 Days)</h2>
          {data.booking_trends && data.booking_trends.length > 0 ? (
            <div className="flex flex-col gap-2">
              {data.booking_trends.slice(-5).map((trend, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-offwhite rounded-md border border-border">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted" />
                    <span className="text-sm font-medium text-charcoal">{new Date(trend.date).toLocaleDateString()}</span>
                  </div>
                  <span className="font-bold text-forest bg-mint px-3 py-1 rounded-full text-sm">{trend.count} bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted border-2 border-dashed border-border rounded-lg">
              <p>No booking data available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

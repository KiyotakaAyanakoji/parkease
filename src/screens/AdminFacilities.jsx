import React, { useState, useEffect } from 'react';
import { Building, Plus, X, BarChart3, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AdminFacilities() {
  const { navigate, role } = useAppContext();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', facility_code: '', address: '', area: '', city: '', description: '', status: 'ACTIVE'
  });
  const [formError, setFormError] = useState('');

  // Performance Modal State
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    };
  });

  const fetchFacilities = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/admin/facilities', {
        credentials: 'include'
      });
      if (res.ok) {
        setFacilities(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'ADMIN') {
      navigate('Login');
      return;
    }
    fetchFacilities();
  }, [role, navigate]);

  const loadPerformance = async (facilityId) => {
    setPerfLoading(true);
    try {
      const qs = `?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`;
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + `/admin/facilities/${facilityId}/performance${qs}`, {
        credentials: 'include'
      });
      if (res.ok) {
        setPerformanceData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPerfLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFacility) {
      loadPerformance(selectedFacility.id);
    }
  }, [dateRange, selectedFacility]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/admin/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create facility');
      
      setShowAddForm(false);
      setFormData({ name: '', facility_code: '', address: '', area: '', city: '', description: '', status: 'ACTIVE' });
      fetchFacilities();
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-forest">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
          <Building size={24} /> Facilities Management
        </h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />} 
          {showAddForm ? 'Cancel' : 'Add Facility'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-border shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold text-forest mb-4">New Facility</h2>
          {formError && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{formError}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Facility Name</label>
              <input required type="text" className="auth-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Unique Code</label>
              <input required type="text" className="auth-input" value={formData.facility_code} onChange={e => setFormData({...formData, facility_code: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-forest mb-1">Address</label>
              <input required type="text" className="auth-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Area</label>
              <input required type="text" className="auth-input" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest mb-1">City</label>
              <input required type="text" className="auth-input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary mt-4">Save Facility</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-sage text-forest text-sm">
            <tr>
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Location</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-muted">No facilities found.</td></tr>
            ) : (
              facilities.map(f => (
                <tr key={f.id} className="border-t border-border hover:bg-offwhite transition-colors">
                  <td className="p-4 font-medium">{f.facility_code}</td>
                  <td className="p-4 font-semibold text-forest">{f.name}</td>
                  <td className="p-4 text-muted">{f.area}, {f.city}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${f.status === 'ACTIVE' ? 'bg-mint text-primary' : 'bg-gray-100 text-gray-600'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      className="btn btn-ghost btn-sm text-primary flex items-center gap-1 ml-auto"
                      onClick={() => setSelectedFacility(f)}
                    >
                      <BarChart3 size={16} /> Performance
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Performance Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 fade-in" onClick={(e) => { if(e.target === e.currentTarget) setSelectedFacility(null)}}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-xl font-bold text-forest flex items-center gap-2">
                <BarChart3 size={20} /> {selectedFacility.name} Performance
              </h2>
              <button onClick={() => setSelectedFacility(null)} className="text-muted hover:text-charcoal"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex gap-4 items-end mb-6 bg-offwhite p-4 rounded-lg border border-border">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Start Date</label>
                  <input type="date" className="auth-input py-1.5" value={dateRange.start_date} onChange={e => setDateRange({...dateRange, start_date: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">End Date</label>
                  <input type="date" className="auth-input py-1.5" value={dateRange.end_date} onChange={e => setDateRange({...dateRange, end_date: e.target.value})} />
                </div>
              </div>

              {perfLoading ? (
                <div className="text-center p-8 text-muted">Loading performance data...</div>
              ) : performanceData ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-border p-4 rounded-lg shadow-sm text-center">
                      <p className="text-xs text-muted font-medium mb-1 uppercase">Total Slots</p>
                      <p className="text-2xl font-bold text-forest">{performanceData.total_slots}</p>
                    </div>
                    <div className="bg-white border border-border p-4 rounded-lg shadow-sm text-center">
                      <p className="text-xs text-muted font-medium mb-1 uppercase">Occupancy</p>
                      <p className="text-2xl font-bold text-primary">{performanceData.occupancy_percentage}%</p>
                    </div>
                    <div className="bg-white border border-border p-4 rounded-lg shadow-sm text-center">
                      <p className="text-xs text-muted font-medium mb-1 uppercase">Bookings</p>
                      <p className="text-2xl font-bold text-forest">{performanceData.bookings_count}</p>
                    </div>
                    <div className="bg-white border border-border p-4 rounded-lg shadow-sm text-center">
                      <p className="text-xs text-muted font-medium mb-1 uppercase">Cancellations</p>
                      <p className="text-2xl font-bold text-error">{performanceData.cancellations_count}</p>
                    </div>
                  </div>
                  
                  <div className="bg-offwhite border border-border rounded-lg p-4">
                    <h3 className="text-sm font-bold text-forest mb-3 uppercase tracking-wider">Current Slot Status</h3>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-mint"></div>
                        <span className="text-sm font-medium text-forest">Available: {performanceData.slot_counts.AVAILABLE}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-sm font-medium text-forest">Reserved: {performanceData.slot_counts.RESERVED}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-charcoal"></div>
                        <span className="text-sm font-medium text-forest">Occupied: {performanceData.slot_counts.OCCUPIED}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-warning"></div>
                        <span className="text-sm font-medium text-forest">Maintenance: {performanceData.slot_counts.MAINTENANCE}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 text-red-600">Failed to load data</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Hash, Plus, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AdminSlots() {
  const { navigate, role } = useAppContext();
  const [slots, setSlots] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    facility_id: '', slot_code: '', vehicle_type: 'car', hourly_rate: '', status: 'AVAILABLE'
  });
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      const opts = { credentials: 'include' };
      const [resSlots, resFacs] = await Promise.all([
        fetch(import.meta.env.VITE_API_BASE_URL + '/admin/slots', opts),
        fetch(import.meta.env.VITE_API_BASE_URL + '/admin/facilities', opts)
      ]);
      
      if (resSlots.ok && resFacs.ok) {
        setSlots(await resSlots.json());
        setFacilities(await resFacs.json());
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
    fetchData();
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create slot');
      
      setShowAddForm(false);
      setFormData({ facility_id: '', slot_code: '', vehicle_type: 'car', hourly_rate: '', status: 'AVAILABLE' });
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-forest">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
          <Hash size={24} /> Parking Slots Management
        </h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />} 
          {showAddForm ? 'Cancel' : 'Add Slot'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-border shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-forest mb-4">New Parking Slot</h2>
          {formError && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{formError}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Facility</label>
              <select required className="auth-input" value={formData.facility_id} onChange={e => setFormData({...formData, facility_id: e.target.value})}>
                <option value="">Select a facility</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.facility_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Slot Code (e.g. A01)</label>
              <input required type="text" className="auth-input" value={formData.slot_code} onChange={e => setFormData({...formData, slot_code: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Hourly Rate (₹)</label>
              <input required type="number" step="0.01" min="0" className="auth-input" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Vehicle Type</label>
              <select className="auth-input" value={formData.vehicle_type} onChange={e => setFormData({...formData, vehicle_type: e.target.value})}>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary mt-4">Save Slot</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-sage text-forest text-sm">
            <tr>
              <th className="p-4 font-medium">Facility</th>
              <th className="p-4 font-medium">Slot Code</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Rate/hr</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-muted">No slots found.</td></tr>
            ) : (
              slots.map(s => (
                <tr key={s.id} className="border-t border-border hover:bg-offwhite transition-colors">
                  <td className="p-4 font-semibold text-forest">{s.facility_name}</td>
                  <td className="p-4 font-medium">{s.slot_code}</td>
                  <td className="p-4 text-muted capitalize">{s.vehicle_type}</td>
                  <td className="p-4 text-muted">₹{Number(s.hourly_rate).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${s.status === 'AVAILABLE' ? 'bg-mint text-primary' : 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
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

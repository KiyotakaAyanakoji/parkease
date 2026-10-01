import React, { useState, useEffect } from 'react';
import { Building, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
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
    <div className="p-6 max-w-7xl mx-auto">
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
            </tr>
          </thead>
          <tbody>
            {facilities.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-muted">No facilities found.</td></tr>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

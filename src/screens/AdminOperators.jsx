import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Power, Edit2, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AdminOperators() {
  const { navigate, role } = useAppContext();
  const [operators, setOperators] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', facilities: []
  });
  const [formError, setFormError] = useState('');

  // Edit State
  const [editingOperator, setEditingOperator] = useState(null);
  const [editFacilities, setEditFacilities] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchData = async () => {
    try {
      const opts = { credentials: 'include' };
      const [resOps, resFacs] = await Promise.all([
        fetch(import.meta.env.VITE_API_BASE_URL + '/admin/operators', opts),
        fetch(import.meta.env.VITE_API_BASE_URL + '/admin/facilities', opts)
      ]);
      
      if (resOps.ok) setOperators(await resOps.json());
      if (resFacs.ok) setFacilities(await resFacs.json());
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
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/admin/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create operator');
      
      setShowAddForm(false);
      setFormData({ name: '', email: '', password: '', facilities: [] });
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this operator?`)) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/operators/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFacility = (facilityId) => {
    setFormData(prev => {
      if (prev.facilities.includes(facilityId)) {
        return { ...prev, facilities: prev.facilities.filter(id => id !== facilityId) };
      }
      return { ...prev, facilities: [...prev.facilities, facilityId] };
    });
  };

  const openEditModal = (op) => {
    setEditingOperator(op);
    setEditError('');
    const assignedIds = op.assigned_facility_ids 
      ? op.assigned_facility_ids.split(',').map(id => parseInt(id, 10))
      : [];
    setEditFacilities(assignedIds);
  };

  const toggleEditFacility = (facilityId) => {
    if (editFacilities.includes(facilityId)) {
      setEditFacilities(editFacilities.filter(id => id !== facilityId));
    } else {
      setEditFacilities([...editFacilities, facilityId]);
    }
  };

  const handleSaveAssignments = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/operators/${editingOperator.id}/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilities: editFacilities }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update assignments');
      
      setEditingOperator(null);
      fetchData();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-forest">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
          <Users size={24} /> Operator Management
        </h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />} 
          {showAddForm ? 'Cancel' : 'Add Operator'}
        </button>
      </div>

      {/* Editing Modal */}
      {editingOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-forest">Edit Assignments</h2>
              {!editLoading && (
                <button onClick={() => setEditingOperator(null)} className="text-muted hover:text-forest">
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="mb-4">
              <p className="font-semibold text-forest">{editingOperator.name}</p>
              <p className="text-sm text-muted">{editingOperator.email}</p>
            </div>
            
            {editError && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{editError}</div>}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-forest mb-2">Assigned Facilities</label>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto p-2 border border-border rounded-md bg-offwhite">
                {facilities.length === 0 ? (
                  <div className="text-sm text-muted p-2">No facilities available.</div>
                ) : (
                  facilities.map(f => (
                    <label key={f.id} className="flex items-center gap-3 p-2 bg-white border border-border rounded-md cursor-pointer hover:bg-sage text-sm transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-primary"
                        checked={editFacilities.includes(f.id)} 
                        onChange={() => toggleEditFacility(f.id)} 
                        disabled={editLoading}
                      />
                      {f.name}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setEditingOperator(null)} 
                className="btn btn-ghost text-forest"
                disabled={editLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAssignments} 
                className="btn btn-primary min-w-[120px] flex items-center justify-center"
                disabled={editLoading}
              >
                {editLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-border shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-forest mb-4">New Operator</h2>
          {formError && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{formError}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Full Name</label>
              <input required type="text" className="auth-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Email</label>
              <input required type="email" className="auth-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Temporary Password</label>
              <input required type="password" minLength="6" className="auth-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-forest mb-2">Assign Facilities</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {facilities.map(f => (
                  <label key={f.id} className="flex items-center gap-2 p-2 border border-border rounded-md cursor-pointer hover:bg-offwhite text-sm">
                    <input 
                      type="checkbox" 
                      checked={formData.facilities.includes(f.id)} 
                      onChange={() => toggleFacility(f.id)} 
                    />
                    {f.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary mt-4">Save Operator</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-sage text-forest text-sm">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Assigned Facilities</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {operators.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-muted">No operators found.</td></tr>
            ) : (
              operators.map(op => (
                <tr key={op.id} className="border-t border-border hover:bg-offwhite transition-colors">
                  <td className="p-4 font-semibold text-forest">{op.name}</td>
                  <td className="p-4 text-muted">{op.email}</td>
                  <td className="p-4 text-sm text-muted">{op.assigned_facilities || <span className="italic">Not assigned</span>}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${op.status === 'ACTIVE' ? 'bg-mint text-primary' : 'bg-red-100 text-red-800'}`}>
                      {op.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEditModal(op)} 
                        className="p-2 text-muted hover:text-primary transition-colors"
                        title="Edit Assignments"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(op.id, op.status)} 
                        className="p-2 text-muted hover:text-red-600 transition-colors"
                        title={op.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={18} />
                      </button>
                    </div>
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

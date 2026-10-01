import React, { useState, useEffect } from 'react';
import { Users, Plus, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AdminOperators() {
  const { navigate, role } = useAppContext();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: ''
  });
  const [formError, setFormError] = useState('');

  const fetchOperators = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/admin/operators', {
        credentials: 'include'
      });
      if (res.ok) {
        setOperators(await res.json());
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
    fetchOperators();
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/admin/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create operator');
      
      setShowAddForm(false);
      setFormData({ name: '', email: '', password: '' });
      fetchOperators();
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-forest">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {operators.length === 0 ? (
              <tr><td colSpan="3" className="p-8 text-center text-muted">No operators found.</td></tr>
            ) : (
              operators.map(op => (
                <tr key={op.id} className="border-t border-border hover:bg-offwhite transition-colors">
                  <td className="p-4 font-semibold text-forest">{op.name}</td>
                  <td className="p-4 text-muted">{op.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${op.status === 'ACTIVE' ? 'bg-mint text-primary' : 'bg-gray-100 text-gray-600'}`}>
                      {op.status}
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

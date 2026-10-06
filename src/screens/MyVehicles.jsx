import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Loader2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    vehicle_type: 'CAR',
    registration_number: '',
    model: '',
    color: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (err) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ vehicle_type: 'CAR', registration_number: '', model: '', color: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      vehicle_type: vehicle.vehicle_type,
      registration_number: vehicle.registration_number,
      model: vehicle.model,
      color: vehicle.color
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await vehicleService.deleteVehicle(id);
      fetchVehicles();
    } catch (err) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (editingId) {
        await vehicleService.updateVehicle(editingId, form);
      } else {
        await vehicleService.addVehicle(form);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setFormError(err.message || 'Failed to save vehicle');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse flex flex-col items-center">
        <Car size={32} className="text-primary mb-4" />
        <div className="h-4 w-32 bg-surface rounded-full"></div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="layout-container py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-forest">My Vehicles</h1>
        <button className="btn btn-primary px-4 py-2 rounded-xl flex items-center gap-2" onClick={openAdd}>
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted border-2 border-dashed border-border rounded-2xl">
            <Car size={48} className="mx-auto text-surface mb-4" />
            <p className="font-medium">You haven't added any vehicles yet.</p>
          </div>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary">
                      {v.vehicle_type === 'BIKE' ? '🏍️' : '🚗'}
                    </div>
                    <span className="font-bold text-forest tracking-tight bg-offwhite px-2 py-1 rounded-md border border-border">{v.registration_number}</span>
                  </div>
                  <div className="flex gap-2 text-muted">
                    <button onClick={() => openEdit(v)} className="hover:text-primary transition-colors"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(v.id)} className="hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-forest mb-1">{v.model}</h3>
                <p className="text-muted font-medium text-sm">Color: <span className="text-charcoal capitalize">{v.color}</span></p>
                <p className="text-muted font-medium text-sm mt-1">Type: <span className="text-charcoal">{v.vehicle_type}</span></p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vehicle Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-forest/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-muted hover:text-forest"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold text-forest mb-6">
                {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              
              {formError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{formError}</div>}
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Vehicle Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      className={`py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${form.vehicle_type === 'CAR' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:border-muted'}`}
                      onClick={() => setForm({ ...form, vehicle_type: 'CAR' })}
                    >
                      🚗 CAR
                    </button>
                    <button 
                      type="button"
                      className={`py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${form.vehicle_type === 'BIKE' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:border-muted'}`}
                      onClick={() => setForm({ ...form, vehicle_type: 'BIKE' })}
                    >
                      🏍️ BIKE
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Registration Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MH01AB1234"
                    className="w-full border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary uppercase font-medium bg-offwhite"
                    value={form.registration_number}
                    onChange={(e) => setForm({ ...form, registration_number: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Model</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hyundai Creta"
                    className="w-full border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-medium"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Color</label>
                  <input 
                    type="text" 
                    placeholder="e.g. White"
                    className="w-full border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-medium"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl mt-4 hover:bg-green transition-colors flex justify-center items-center"
                >
                  {formLoading ? <Loader2 size={20} className="animate-spin" /> : (editingId ? 'Save Changes' : 'Add Vehicle')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

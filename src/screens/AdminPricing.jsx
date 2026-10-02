import React, { useState, useEffect } from 'react';

const AdminPricing = () => {
  const [pricings, setPricings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPricings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/admin/pricing`, { 
        credentials: 'include' 
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error fetching pricing configurations');
      }
      const data = await res.json();
      setPricings(data);
    } catch (err) {
      setError(err.message || 'Error fetching pricing configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricings();
  }, []);

  const handleEdit = (pricing) => {
    setSelectedPricing({ ...pricing });
    setSuccessMsg('');
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/admin/pricing/${selectedPricing.facility_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(selectedPricing)
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error updating pricing');
      }
      
      setSuccessMsg('Pricing updated successfully');
      fetchPricings();
      setTimeout(() => setSelectedPricing(null), 1500);
    } catch (err) {
      setError(err.message || 'Error updating pricing');
    }
  };

  if (loading) return <div className="p-8">Loading pricing configurations...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Management</h1>
          <p className="text-gray-600">Configure base rates and dynamic multipliers for facilities.</p>
        </div>
      </div>

      {error && !selectedPricing && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-700">Facility</th>
              <th className="p-4 font-semibold text-gray-700">Base Rate</th>
              <th className="p-4 font-semibold text-gray-700">Peak config</th>
              <th className="p-4 font-semibold text-gray-700">Weekend config</th>
              <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pricings.map((p) => (
              <tr key={p.facility_id} className="hover:bg-gray-50/50">
                <td className="p-4 font-medium text-gray-900">{p.facility_name}</td>
                <td className="p-4 text-gray-600">₹{parseFloat(p.base_hourly_rate).toFixed(2)} / hr</td>
                <td className="p-4 text-gray-600">
                  {p.peak_enabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700">
                      {p.peak_multiplier}x ({p.peak_start_time.slice(0,5)} - {p.peak_end_time.slice(0,5)})
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Disabled</span>
                  )}
                </td>
                <td className="p-4 text-gray-600">
                  {p.weekend_enabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700">
                      {p.weekend_multiplier}x
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Disabled</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-parkease-green hover:text-green-700 font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {pricings.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No pricing configurations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedPricing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Pricing: {selectedPricing.facility_name}</h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              {successMsg && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{successMsg}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Hourly Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={selectedPricing.base_hourly_rate}
                  onChange={(e) => setSelectedPricing({...selectedPricing, base_hourly_rate: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parkease-green/20"
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="peakEnabled"
                    checked={!!selectedPricing.peak_enabled}
                    onChange={(e) => setSelectedPricing({...selectedPricing, peak_enabled: e.target.checked ? 1 : 0})}
                    className="h-4 w-4 text-parkease-green rounded border-gray-300 focus:ring-parkease-green"
                  />
                  <label htmlFor="peakEnabled" className="ml-2 block text-sm font-bold text-gray-900">
                    Enable Peak Pricing
                  </label>
                </div>

                {!!selectedPricing.peak_enabled && (
                  <div className="grid grid-cols-3 gap-4 ml-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                      <input
                        type="time"
                        required
                        value={selectedPricing.peak_start_time}
                        onChange={(e) => setSelectedPricing({...selectedPricing, peak_start_time: e.target.value})}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                      <input
                        type="time"
                        required
                        value={selectedPricing.peak_end_time}
                        onChange={(e) => setSelectedPricing({...selectedPricing, peak_end_time: e.target.value})}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Multiplier (e.g. 1.5)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={selectedPricing.peak_multiplier}
                        onChange={(e) => setSelectedPricing({...selectedPricing, peak_multiplier: e.target.value})}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="weekendEnabled"
                    checked={!!selectedPricing.weekend_enabled}
                    onChange={(e) => setSelectedPricing({...selectedPricing, weekend_enabled: e.target.checked ? 1 : 0})}
                    className="h-4 w-4 text-parkease-green rounded border-gray-300 focus:ring-parkease-green"
                  />
                  <label htmlFor="weekendEnabled" className="ml-2 block text-sm font-bold text-gray-900">
                    Enable Weekend Pricing
                  </label>
                </div>

                {!!selectedPricing.weekend_enabled && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Multiplier (e.g. 1.2)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={selectedPricing.weekend_multiplier}
                        onChange={(e) => setSelectedPricing({...selectedPricing, weekend_multiplier: e.target.value})}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPricing(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-parkease-green text-white hover:bg-green-700 rounded-lg font-medium shadow-sm transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPricing;

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const vehicleService = {
  async getVehicles() {
    const res = await fetch(`${API_BASE}/vehicles`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return res.json();
  },

  async addVehicle(data) {
    const res = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to add vehicle');
    return json;
  },

  async updateVehicle(id, data) {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update vehicle');
    return json;
  },

  async deleteVehicle(id) {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete vehicle');
    return json;
  }
};

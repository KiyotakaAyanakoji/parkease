import React, { useState, useEffect } from 'react';
import { Building, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function OperatorFacilities() {
  const { navigate, role } = useAppContext();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFacilities = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/operator/overview', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities);
      } else {
        setError('Failed to load facilities.');
      }
    } catch (e) {
      console.error(e);
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'OPERATOR') {
      navigate('Login');
      return;
    }
    fetchFacilities();
  }, [role, navigate]);

  if (loading) return <div className="p-8 text-forest">Loading My Facilities...</div>;
  if (error) return <div className="p-8 text-red-600 font-bold">{error}</div>;
  if (facilities.length === 0) return <div className="p-8 text-amber-600 font-bold">You are not assigned to any facilities. An Admin must assign you to one first.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-forest flex items-center gap-2 mb-6">
        <Building size={24} /> My Assigned Facilities
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map(f => (
          <div key={f.id} className="bg-white rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-forest mb-2">{f.name}</h2>
            <div className="flex items-start gap-2 text-muted text-sm mb-4">
              <MapPin size={16} className="mt-0.5" />
              <span>{f.address}<br/>{f.area}, {f.city}</span>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <span className={`px-2 py-1 text-xs rounded-full ${f.status === 'ACTIVE' ? 'bg-mint text-primary' : 'bg-gray-100 text-gray-600'}`}>
                {f.status}
              </span>
              <span className="text-xs font-mono text-muted">CODE: {f.facility_code}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

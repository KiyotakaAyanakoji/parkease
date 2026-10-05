import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { MapPin, ArrowLeft, Info } from 'lucide-react';

export default function ParkingDetails() {
  const { screenProps, navigate } = useAppContext();
  const { facilityId } = screenProps;
  
  const [lot, setLot] = useState(null);
  const [lotSlots, setLotSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const opts = { credentials: 'include' };
        const [facRes, slotsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/driver/facilities/${facilityId}`, opts),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/driver/facilities/${facilityId}/slots`, opts)
        ]);
        
        if (!facRes.ok || !slotsRes.ok) throw new Error('Failed to fetch parking details');
        
        setLot(await facRes.json());
        setLotSlots(await slotsRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (facilityId) fetchData();
  }, [facilityId]);

  if (loading) return <div className="p-8 text-forest">Loading...</div>;
  if (error || !lot) return <div className="p-8 text-red-600">{error || 'Lot not found'}</div>;

  const available = lotSlots.filter(s => s.status === 'AVAILABLE').length;
  // Use a fallback price if the DB doesn't have it on the facility, although slots have hourly_rate
  const pricePerHour = lotSlots.length > 0 ? lotSlots[0].hourly_rate : 0;

  return (
    <div className="fade-in max-w-3xl mx-auto">
      <button 
        className="btn btn-ghost p-0 mb-6 flex items-center gap-2"
        onClick={() => navigate('DriverDashboard')}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-forest mb-2">{lot.name}</h2>
        <div className="flex items-center gap-1 text-sm text-muted mb-4">
          <MapPin size={16} />
          <span>{lot.area}, {lot.city}</span>
        </div>
        
        <p className="text-charcoal mb-6">{lot.description}</p>
        
        <div className="flex gap-4 p-4 bg-offwhite rounded-md mb-6">
          <div className="flex-1 text-center border-r border-border">
            <span className="block text-xl font-bold text-forest">₹{pricePerHour}</span>
            <span className="text-xs text-muted">Per Hour</span>
          </div>
          <div className="flex-1 text-center">
            <span className="block text-xl font-bold text-forest">{available} / {lotSlots.length}</span>
            <span className="text-xs text-muted">Available Slots</span>
          </div>
        </div>
      </div>

      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-forest mb-4">Select a slot</h3>
        
        <div className="flex items-center gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-border bg-white rounded-sm"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded-sm"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-border bg-offwhite opacity-70 rounded-sm"></div>
            <span>Occupied</span>
          </div>
        </div>

        <div className="slots-grid">
          {lotSlots.length === 0 ? (
            <div className="text-muted">No slots available.</div>
          ) : (
            lotSlots.map(slot => {
              const isSelected = selectedSlot?.id === slot.id;
              // Map DB status to UI classes
              const statusClass = slot.status === 'AVAILABLE' ? 'available' : 'occupied';
              
              return (
                <button
                  key={slot.id}
                  disabled={slot.status !== 'AVAILABLE'}
                  className={`slot ${statusClass} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.slot_code}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-white border border-border rounded-md shadow-sm sticky bottom-4">
        <div>
          <span className="block text-sm text-muted">Selected Slot</span>
          <span className="font-semibold text-forest text-lg">
            {selectedSlot ? selectedSlot.slot_code : 'None'}
          </span>
        </div>
        <button 
          className="btn btn-primary"
          disabled={!selectedSlot}
          onClick={() => navigate('ReservationForm', { lot, slot: selectedSlot })}
        >
          Continue to Reservation
        </button>
      </div>
    </div>
  );
}

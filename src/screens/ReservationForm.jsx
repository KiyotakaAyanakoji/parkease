import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Clock, Info } from 'lucide-react';

export default function ReservationForm() {
  const { screenProps, navigate } = useAppContext();
  const { lot, slot } = screenProps;
  
  const [vehicle, setVehicle] = useState('MH-01-AB-1234');
  const [duration, setDuration] = useState(2); // hours
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  if (!lot || !slot) return <div>Invalid reservation state</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!time) return;
    
    setLoading(true);
    setError('');

    // Create demo date based on today and selected time
    const [hours, minutes] = time.split(':');
    const expectedArrival = new Date();
    expectedArrival.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Format to MySQL datetime: YYYY-MM-DD HH:MM:SS
    const mysqlArrival = expectedArrival.toISOString().slice(0, 19).replace('T', ' ');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/driver/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          facility_id: lot.id,
          slot_id: slot.id,
          vehicle_reg: vehicle,
          expected_arrival: mysqlArrival,
          expected_duration_hours: parseInt(duration, 10)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create booking');
      
      const booking = {
        id: data.bookingId,
        facility_name: lot.name,
        slot_code: slot.slot_code,
        vehicle_reg: vehicle,
        expected_arrival: mysqlArrival,
        expected_duration_hours: duration,
        status: 'RESERVED',
        total_price: slot.hourly_rate * duration
      };

      navigate('BookingConfirmation', { booking, lot, slot });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const estimatedTotal = (slot.hourly_rate || 0) * duration;

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <button 
        className="btn btn-ghost p-0 mb-6 flex items-center gap-2"
        onClick={() => navigate('ParkingDetails', { facilityId: lot.id })}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="text-2xl font-bold text-forest mb-6">Complete Reservation</h2>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <form className="card" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Vehicle Registration</label>
              <select className="form-select" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                <option value="MH-01-AB-1234">MH-01-AB-1234 (Honda City)</option>
                <option value="MH-02-XY-9876">MH-02-XY-9876 (Hyundai Creta)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 form-group">
              <div>
                <label className="form-label">Expected Arrival Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Duration (Hours)</label>
                <select className="form-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours</option>
                </select>
              </div>
            </div>

            <div className="bg-mint p-4 rounded-md mb-6 flex gap-3 text-sm text-forest items-start">
              <Info size={20} className="text-primary shrink-0" />
              <p>
                <strong>Illustrative Arrival Window:</strong> We estimate your travel time. You have a 15-minute grace period after your expected arrival. If you're late, you can request one extension.
              </p>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={!time || loading}>
              {loading ? 'Processing...' : 'Confirm Reservation'}
            </button>
          </form>
        </div>

        <div>
          <div className="card sticky top-24">
            <h3 className="font-semibold text-forest mb-4 border-b border-border pb-2">Summary</h3>
            
            <div className="mb-4">
              <span className="text-xs text-muted block">Location</span>
              <span className="font-medium text-charcoal block">{lot.name}</span>
            </div>
            
            <div className="mb-4">
              <span className="text-xs text-muted block">Slot</span>
              <span className="font-medium text-charcoal block">{slot.slot_code}</span>
            </div>

            <div className="mb-4">
              <span className="text-xs text-muted block">Rate</span>
              <span className="font-medium text-charcoal block">₹{slot.hourly_rate} / hour</span>
            </div>

            <div className="pt-4 border-t border-border mt-4 flex justify-between items-center">
              <span className="font-semibold text-forest">Estimated</span>
              <span className="font-bold text-xl text-forest">₹{estimatedTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

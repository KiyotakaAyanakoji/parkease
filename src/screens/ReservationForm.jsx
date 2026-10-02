import React, { useState, useEffect } from 'react';
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
  
  // Estimate state
  const [estimate, setEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState('');

  // Fetch estimate whenever time or duration changes
  useEffect(() => {
    if (!time || !duration) {
      setEstimate(null);
      return;
    }

    const fetchEstimate = async () => {
      setLoadingEstimate(true);
      setEstimateError('');
      
      const [hours, minutes] = time.split(':');
      const expectedArrival = new Date();
      expectedArrival.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const mysqlArrival = expectedArrival.toISOString().slice(0, 19).replace('T', ' ');

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/driver/estimate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            facility_id: lot.id,
            expected_arrival: mysqlArrival,
            expected_duration_hours: parseInt(duration, 10)
          })
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Error fetching estimate');
        }
        
        const data = await res.json();
        setEstimate(data);
      } catch (err) {
        setEstimateError(err.message || 'Error fetching estimate');
        setEstimate(null);
      } finally {
        setLoadingEstimate(false);
      }
    };

    const debounceId = setTimeout(fetchEstimate, 500);
    return () => clearTimeout(debounceId);
  }, [time, duration, lot?.id]);

  if (!lot || !slot) return <div>Invalid reservation state</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!time || !estimate) return;
    
    setLoading(true);
    setError('');

    const [hours, minutes] = time.split(':');
    const expectedArrival = new Date();
    expectedArrival.setHours(parseInt(hours), parseInt(minutes), 0, 0);
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
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error creating booking');
      }
      
      const data = await res.json();
      
      const booking = {
        id: data.bookingId,
        facility_name: lot.name,
        slot_code: slot.slot_code,
        vehicle_reg: vehicle,
        expected_arrival: mysqlArrival,
        expected_duration_hours: duration,
        status: 'RESERVED',
        total_price: data.confirmedPrice,
        pricing_breakdown: estimate // passing the breakdown for confirmation screen
      };

      navigate('BookingConfirmation', { booking, lot, slot });
    } catch (err) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-4xl mx-auto py-8 px-4">
      <button 
        className="btn btn-ghost p-0 mb-6 flex items-center gap-2"
        onClick={() => navigate('ParkingDetails', { facilityId: lot.id })}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="text-2xl font-bold text-forest mb-6">Complete Reservation</h2>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <form className="card" onSubmit={handleSubmit}>
            <div className="form-group mb-6">
              <label className="form-label font-medium mb-2 block">Vehicle Registration</label>
              <select className="form-select w-full" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                <option value="MH-01-AB-1234">MH-01-AB-1234 (Honda City)</option>
                <option value="MH-02-XY-9876">MH-02-XY-9876 (Hyundai Creta)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6 form-group mb-6">
              <div>
                <label className="form-label font-medium mb-2 block">Expected Arrival</label>
                <input 
                  type="time" 
                  className="form-input w-full" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label font-medium mb-2 block">Duration</label>
                <select className="form-select w-full" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours</option>
                </select>
              </div>
            </div>

            <div className="bg-mint/30 border border-mint p-4 rounded-xl mb-8 flex gap-3 text-sm text-forest items-start shadow-sm">
              <Info size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-forest mb-1">Arrival Window</h4>
                <p className="text-forest/80 leading-relaxed">
                  You have a 15-minute grace period after your expected arrival time. Your slot is guaranteed during this window.
                  The price is calculated based on the rules active at your exact expected arrival time.
                </p>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={!time || loading || !estimate || loadingEstimate}>
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

            {loadingEstimate ? (
              <div className="p-4 text-center text-sm text-gray-500 animate-pulse">Calculating price estimate...</div>
            ) : estimateError ? (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm mb-4">{estimateError}</div>
            ) : estimate ? (
              <>
                <div className="mb-4 space-y-2 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted">Base Rate</span>
                    <span className="font-medium">₹{estimate.baseRate.toFixed(2)} / hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Base Amount</span>
                    <span className="font-medium">₹{estimate.baseAmount.toFixed(2)}</span>
                  </div>
                  {estimate.peakApplied && (
                    <div className="flex justify-between text-parkease-green">
                      <span>Peak Multiplier</span>
                      <span className="font-medium">x {estimate.peakMultiplier}</span>
                    </div>
                  )}
                  {estimate.weekendApplied && (
                    <div className="flex justify-between text-parkease-green">
                      <span>Weekend Multiplier</span>
                      <span className="font-medium">x {estimate.weekendMultiplier}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                    {estimate.explanation}
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4 flex justify-between items-center">
                  <span className="font-semibold text-forest">Estimated</span>
                  <span className="font-bold text-xl text-forest">₹{estimate.finalAmount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                Select arrival time to see price estimate.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

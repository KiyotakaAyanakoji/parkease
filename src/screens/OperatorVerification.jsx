import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, CheckCircle2, XCircle } from 'lucide-react';

export default function OperatorVerification() {
  const { bookings, slots, parkingLots, updateBookingStatus, screenProps, navigate } = useAppContext();
  const [code, setCode] = useState(screenProps?.prefillId || '');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (screenProps?.prefillId) {
      handleVerify(screenProps.prefillId);
    }
  }, [screenProps]);

  const handleVerify = (bookingIdToVerify) => {
    const id = bookingIdToVerify || code;
    if (!id) return;
    
    const booking = bookings.find(b => b.id.toUpperCase() === id.toUpperCase());
    
    if (!booking) {
      setResult({ valid: false, message: 'Booking not found.' });
      return;
    }
    
    if (booking.status === 'cancelled' || booking.status === 'released') {
      setResult({ valid: false, message: 'Booking is cancelled or released.' });
      return;
    }
    
    if (booking.status === 'completed') {
      setResult({ valid: false, message: 'Booking already completed.' });
      return;
    }
    
    if (booking.status === 'checked-in') {
      setResult({ valid: true, booking, message: 'Already checked in.', alreadyIn: true });
      return;
    }
    
    setResult({ valid: true, booking });
  };

  const handleCheckIn = () => {
    if (result?.booking) {
      updateBookingStatus(result.booking.id, 'checked-in');
      navigate('OperatorDashboard');
    }
  };

  return (
    <div className="fade-in max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-forest mb-6">Verify & Check-in</h2>

      <div className="card mb-8">
        <label className="form-label mb-2">Booking Code / QR Reference</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            className="form-input font-mono uppercase" 
            placeholder="e.g. BKG-12345"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          <button className="btn btn-primary" onClick={() => handleVerify()}>
            Verify
          </button>
        </div>
      </div>

      {result && (
        <div className={`card ${result.valid ? 'border-primary border-2' : 'border-error border-2'}`}>
          <div className="flex items-center gap-3 mb-4">
            {result.valid ? <CheckCircle2 className="text-primary" size={24} /> : <XCircle className="text-error" size={24} />}
            <h3 className="font-semibold text-lg">{result.valid ? 'Valid Booking' : 'Invalid Booking'}</h3>
          </div>
          
          <p className={result.valid ? 'text-charcoal' : 'text-error'}>{result.message}</p>
          
          {result.valid && result.booking && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <span className="block text-muted">Driver</span>
                  <span className="font-medium text-forest">{result.booking.driverName}</span>
                </div>
                <div>
                  <span className="block text-muted">Vehicle</span>
                  <span className="font-medium text-forest">{result.booking.vehicle}</span>
                </div>
                <div>
                  <span className="block text-muted">Slot</span>
                  <span className="font-medium text-forest">{slots.find(s => s.id === result.booking.slotId)?.label}</span>
                </div>
                <div>
                  <span className="block text-muted">Parking Lot</span>
                  <span className="font-medium text-forest">{parkingLots.find(l => l.id === result.booking.lotId)?.name}</span>
                </div>
              </div>
              
              {!result.alreadyIn && (
                <button className="btn btn-primary w-full" onClick={handleCheckIn}>
                  Confirm Check-in
                </button>
              )}
              {result.alreadyIn && (
                <button className="btn btn-outline w-full" onClick={() => navigate('CheckoutReceipt', { bookingId: result.booking.id })}>
                  Proceed to Checkout
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

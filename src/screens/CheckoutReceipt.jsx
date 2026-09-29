import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function CheckoutReceipt() {
  const { bookings, parkingLots, slots, updateBookingStatus, screenProps, navigate } = useAppContext();
  const { bookingId } = screenProps;
  
  const [completed, setCompleted] = useState(false);
  
  const booking = bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    return (
      <div className="text-center p-8">
        <p className="text-error">Booking not found.</p>
        <button className="btn btn-outline mt-4" onClick={() => navigate('OperatorDashboard')}>Go Back</button>
      </div>
    );
  }

  const lot = parkingLots.find(l => l.id === booking.lotId);
  const slot = slots.find(s => s.id === booking.slotId);

  const handleCheckout = () => {
    updateBookingStatus(booking.id, 'completed');
    setCompleted(true);
  };

  const simulatedAmount = booking.price; // Prototype simplifies this to the estimated price
  
  if (completed || booking.status === 'completed') {
    return (
      <div className="fade-in max-w-md mx-auto">
        <button className="btn btn-ghost p-0 mb-6 flex items-center gap-2" onClick={() => navigate('OperatorDashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="card bg-white p-8 relative">
          <div className="absolute top-0 right-0 left-0 h-2 bg-primary"></div>
          
          <div className="text-center border-b border-dashed border-border pb-6 mb-6">
            <h2 className="text-2xl font-bold text-forest mb-1">ParkEase</h2>
            <p className="text-sm text-muted">Receipt / Tax Invoice</p>
            <p className="text-xs text-muted mt-2">Ref: {booking.id}</p>
          </div>
          
          <div className="space-y-4 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Location:</span>
              <span className="font-medium text-forest text-right">{lot?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Slot:</span>
              <span className="font-medium text-forest">{slot?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Vehicle:</span>
              <span className="font-medium text-forest">{booking.vehicle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Duration:</span>
              <span className="font-medium text-forest">{booking.duration} Hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Rate:</span>
              <span className="font-medium text-forest">₹{lot?.pricePerHour}/hr</span>
            </div>
          </div>
          
          <div className="border-t border-dashed border-border pt-4 mb-6">
            <div className="flex justify-between items-center text-lg font-bold text-forest">
              <span>Total Paid</span>
              <span>₹{simulatedAmount}</span>
            </div>
            <p className="text-xs text-center text-muted mt-4 bg-offwhite p-2 rounded">
              Demo only: no real payment was processed
            </p>
          </div>
          
          <button className="btn btn-outline w-full flex items-center justify-center gap-2" onClick={() => window.print()}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-forest mb-6">Checkout Driver</h2>
      
      <div className="card mb-6">
        <h3 className="font-semibold text-lg text-forest mb-4 border-b border-border pb-2">Booking {booking.id}</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <span className="block text-muted">Driver</span>
            <span className="font-medium">{booking.driverName}</span>
          </div>
          <div>
            <span className="block text-muted">Vehicle</span>
            <span className="font-medium">{booking.vehicle}</span>
          </div>
          <div>
            <span className="block text-muted">Location</span>
            <span className="font-medium">{lot?.name}</span>
          </div>
          <div>
            <span className="block text-muted">Slot</span>
            <span className="font-medium">{slot?.label}</span>
          </div>
        </div>
        
        <div className="bg-mint p-4 rounded-md mb-6 flex justify-between items-center text-forest">
          <div>
            <span className="block text-sm font-semibold">Calculated Amount</span>
            <span className="text-xs">Based on {booking.duration} hours stay</span>
          </div>
          <span className="text-2xl font-bold">₹{simulatedAmount}</span>
        </div>
        
        <div className="flex gap-4">
          <button className="btn btn-ghost flex-1" onClick={() => navigate('OperatorDashboard')}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleCheckout}>Process Checkout</button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, QrCode } from 'lucide-react';

export default function BookingConfirmation() {
  const { screenProps, navigate } = useAppContext();
  const { booking, lot, slot } = screenProps;

  if (!booking) return <div>No booking data found.</div>;

  const expectedArrival = new Date(booking.expected_arrival);
  const deadline = new Date(expectedArrival.getTime() + 15 * 60000); // 15 min grace period

  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fade-in max-w-xl mx-auto text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center text-primary">
          <CheckCircle2 size={40} />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-forest mb-2">Your parking is reserved.</h2>
      <p className="text-muted mb-8">Booking Reference: <span className="font-bold text-charcoal">{booking.id}</span></p>

      <div className="card text-left mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <span className="badge badge-success">Reserved</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-2">
          <div>
            <h3 className="text-sm text-muted mb-1">Parking Lot</h3>
            <p className="font-semibold text-charcoal">{lot.name}</p>
            <p className="text-sm text-muted">{lot.area}</p>
          </div>
          
          <div>
            <h3 className="text-sm text-muted mb-1">Slot</h3>
            <p className="font-semibold text-charcoal text-xl">{slot.slot_code}</p>
          </div>

          <div>
            <h3 className="text-sm text-muted mb-1">Vehicle</h3>
            <p className="font-semibold text-charcoal">{booking.vehicle_reg}</p>
          </div>

          <div>
            <h3 className="text-sm text-muted mb-1">Duration</h3>
            <p className="font-semibold text-charcoal">{booking.expected_duration_hours} Hours</p>
          </div>

          <div className="md:col-span-2 border-t border-border pt-4 mt-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-forest">Confirmed Amount</h3>
              <span className="font-bold text-xl text-forest">₹{booking.total_price}</span>
            </div>
            {booking.pricing_breakdown && (
              <div className="text-xs text-muted bg-gray-50 p-3 rounded-md">
                {booking.pricing_breakdown.explanation}
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-sage p-4 rounded-md">
            <h3 className="text-sm font-semibold text-forest mb-2">Arrival Timeline</h3>
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="block text-muted">Expected Arrival</span>
                <span className="font-medium text-forest">{formatTime(expectedArrival)}</span>
              </div>
              <div className="text-right">
                <span className="block text-muted">Deadline (Hold until)</span>
                <span className="font-medium text-warning">{formatTime(deadline)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex flex-col items-center justify-center">
          <div className="border-4 border-forest p-2 rounded bg-white mb-2 inline-block">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.id}`}
              alt={`QR Code for Booking ${booking.id}`}
              width={120}
              height={120}
              className="mx-auto"
            />
          </div>
          <span className="text-xs font-semibold text-forest uppercase tracking-widest">Booking QR Code</span>
          <span className="text-xs text-muted mt-1">Show this at the entrance</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="btn btn-outline" onClick={() => navigate('DriverDashboard')}>
          Back to Dashboard
        </button>
        <button className="btn btn-primary" onClick={() => navigate('MyBookings')}>
          View My Bookings
        </button>
      </div>
    </div>
  );
}

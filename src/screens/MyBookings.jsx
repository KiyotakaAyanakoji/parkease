import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Ban } from 'lucide-react';

export default function MyBookings() {
  const { bookings, parkingLots, slots, updateBookingStatus, navigate } = useAppContext();
  const [filter, setFilter] = useState('active'); // active, completed, cancelled

  const activeStatuses = ['reserved', 'checked-in', 'awaiting-response', 'confirmed-late'];
  
  const filteredBookings = bookings.filter(b => {
    if (filter === 'active') return activeStatuses.includes(b.status);
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return b.status === 'cancelled' || b.status === 'released';
    return true;
  });

  const handleCancel = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      updateBookingStatus(bookingId, 'cancelled');
    }
  };

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost p-0" onClick={() => navigate('DriverDashboard')}>
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-2xl font-bold text-forest">My Bookings</h2>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        <button 
          className={`px-4 py-2 text-sm font-medium border-b-2 ${filter === 'active' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium border-b-2 ${filter === 'completed' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium border-b-2 ${filter === 'cancelled' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 card bg-offwhite border-none shadow-none">
          <p className="text-muted mb-4">No {filter} bookings found.</p>
          {filter === 'active' && (
            <button className="btn btn-primary" onClick={() => navigate('DriverDashboard')}>
              Find Parking
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map(booking => {
            const lot = parkingLots.find(l => l.id === booking.lotId);
            const slot = slots.find(s => s.id === booking.slotId);
            const isCancellable = booking.status === 'reserved' || booking.status === 'awaiting-response';

            return (
              <div key={booking.id} className="card flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-forest">{booking.id}</span>
                    <span className={`badge ${booking.status === 'checked-in' ? 'badge-success' : booking.status === 'cancelled' || booking.status === 'released' ? 'badge-error' : 'badge-neutral'}`}>
                      {booking.status.replace('-', ' ')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-lg text-charcoal">{lot?.name}</h4>
                  <p className="text-sm text-muted">Slot: {slot?.label || booking.slotId} • {new Date(booking.expectedArrival).toLocaleDateString()}</p>
                </div>
                
                <div className="flex flex-col md:items-end gap-2 text-sm">
                  <span className="font-semibold text-forest">₹{booking.price}</span>
                  {isCancellable && (
                    <button 
                      className="text-error font-medium hover:underline flex items-center gap-1"
                      onClick={() => handleCancel(booking.id)}
                    >
                      <Ban size={14} /> Cancel Reservation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Ban, QrCode, X } from 'lucide-react';

export default function MyBookings() {
  const { navigate } = useAppContext();
  const [filter, setFilter] = useState('active'); // active, completed, cancelled
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/driver/bookings`, {
        credentials: 'include'
      });
      if (res.ok) {
        setBookings(await res.json());
      } else {
        throw new Error('Failed to load bookings');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const activeStatuses = ['RESERVED', 'CHECKED_IN'];
  
  const filteredBookings = bookings.filter(b => {
    if (filter === 'active') return activeStatuses.includes(b.status);
    if (filter === 'completed') return b.status === 'COMPLETED';
    if (filter === 'cancelled') return b.status === 'CANCELLED';
    return true;
  });

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/driver/bookings/${bookingId}/cancel`, {
          method: 'POST',
          credentials: 'include'
        });
        if (res.ok) {
          fetchBookings();
        } else {
          alert('Failed to cancel booking');
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) return <div className="p-8 text-forest">Loading...</div>;

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
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

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
            const isCancellable = booking.status === 'RESERVED';
            const showQR = ['RESERVED', 'CHECKED_IN'].includes(booking.status);

            return (
              <div key={booking.id} className="card flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-forest">{booking.id}</span>
                    <span className={`badge ${booking.status === 'CHECKED_IN' ? 'badge-success' : booking.status === 'CANCELLED' ? 'badge-error' : 'badge-neutral'}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-lg text-charcoal">{booking.facility_name}</h4>
                  <p className="text-sm text-muted">Slot: {booking.slot_code} • {new Date(booking.expected_arrival).toLocaleDateString()}</p>
                </div>
                
                <div className="flex flex-col md:items-end gap-3 text-sm">
                  {booking.pricing_rules_applied ? (
                    <div className="text-right">
                      <span className="font-semibold text-forest text-lg">₹{booking.total_price}</span>
                      <p className="text-xs text-muted max-w-xs">{booking.pricing_rules_applied.explanation}</p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="font-semibold text-forest text-lg">₹{booking.total_price}</span>
                      <p className="text-xs text-muted italic">Price not recorded</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 flex-wrap border-t border-border pt-2 w-full md:w-auto md:justify-end">
                    {showQR && (
                      <button 
                        className="btn btn-primary btn-sm flex items-center gap-1"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <QrCode size={16} /> View QR
                      </button>
                    )}
                    {isCancellable && (
                      <button 
                        className="text-error font-medium hover:underline flex items-center gap-1"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <Ban size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedBooking(null); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              className="absolute top-4 right-4 text-muted hover:text-charcoal"
              onClick={() => setSelectedBooking(null)}
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-forest mb-4 text-center">Booking QR Code</h3>
            
            {['RESERVED', 'CHECKED_IN'].includes(selectedBooking.status) ? (
              <div className="flex flex-col items-center">
                <div className="border-4 border-forest p-2 rounded bg-white mb-4">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedBooking.id}`}
                    alt="Booking QR"
                    width={150}
                    height={150}
                  />
                </div>
                <p className="text-sm text-center text-muted mb-6">
                  Present this QR code to the operator upon {selectedBooking.status === 'RESERVED' ? 'arrival' : 'departure'}.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-center text-sm">
                QR code is only available for active reservations. This booking is currently <strong>{selectedBooking.status}</strong>.
              </div>
            )}

            <div className="space-y-3 text-sm bg-offwhite p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted">Reference</span>
                <span className="font-bold text-charcoal">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Facility</span>
                <span className="font-medium text-charcoal">{selectedBooking.facility_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Slot</span>
                <span className="font-medium text-charcoal">{selectedBooking.slot_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Vehicle</span>
                <span className="font-medium text-charcoal">{selectedBooking.vehicle_reg}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Arrival</span>
                <span className="font-medium text-charcoal">{new Date(selectedBooking.expected_arrival).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className="font-medium text-charcoal font-bold">{selectedBooking.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

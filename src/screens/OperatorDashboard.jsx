import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, Car, CheckCircle, Clock } from 'lucide-react';

export default function OperatorDashboard() {
  const { parkingLots, slots, bookings, navigate } = useAppContext();
  const [selectedLotId, setSelectedLotId] = useState(parkingLots[0].id);

  const lotSlots = slots.filter(s => s.lotId === selectedLotId);
  const totalSlots = lotSlots.length;
  const occupiedSlots = lotSlots.filter(s => s.status === 'occupied').length;
  const reservedSlots = lotSlots.filter(s => s.status === 'reserved').length;
  const availableSlots = lotSlots.filter(s => s.status === 'available').length;
  
  const occupancyPercentage = ((occupiedSlots + reservedSlots) / totalSlots) * 100;

  const lotBookings = bookings.filter(b => b.lotId === selectedLotId && ['reserved', 'checked-in', 'awaiting-response', 'confirmed-late'].includes(b.status));

  return (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-forest">Parking Overview</h2>
          <p className="text-muted">Monitor occupancy and expected arrivals.</p>
        </div>
        <select 
          className="form-select w-auto min-w-[200px]"
          value={selectedLotId}
          onChange={(e) => setSelectedLotId(e.target.value)}
        >
          {parkingLots.map(lot => (
            <option key={lot.id} value={lot.id}>{lot.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="card text-center p-4">
          <span className="text-sm text-muted">Total Slots</span>
          <span className="block text-2xl font-bold text-forest mt-1">{totalSlots}</span>
        </div>
        <div className="card text-center p-4 border-l-4" style={{borderLeftColor: 'var(--color-primary)'}}>
          <span className="text-sm text-muted">Available</span>
          <span className="block text-2xl font-bold text-primary mt-1">{availableSlots}</span>
        </div>
        <div className="card text-center p-4">
          <span className="text-sm text-muted">Occupied</span>
          <span className="block text-2xl font-bold text-charcoal mt-1">{occupiedSlots}</span>
        </div>
        <div className="card text-center p-4">
          <span className="text-sm text-muted">Reserved</span>
          <span className="block text-2xl font-bold text-warning mt-1">{reservedSlots}</span>
        </div>
      </div>

      <div className="card mb-8 p-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-forest">Occupancy</h3>
          <span className="text-sm font-medium">{Math.round(occupancyPercentage)}%</span>
        </div>
        <div className="w-full h-3 bg-offwhite rounded-full overflow-hidden flex">
          <div className="h-full bg-charcoal" style={{width: `${(occupiedSlots/totalSlots)*100}%`}}></div>
          <div className="h-full bg-warning opacity-80" style={{width: `${(reservedSlots/totalSlots)*100}%`}}></div>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted">
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-charcoal rounded-sm"></div> Occupied</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-warning opacity-80 rounded-sm"></div> Reserved</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-forest">Current Reservations</h3>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-offwhite border-b border-border">
              <tr>
                <th className="p-4 font-semibold text-forest">Ref</th>
                <th className="p-4 font-semibold text-forest">Slot</th>
                <th className="p-4 font-semibold text-forest">Arrival</th>
                <th className="p-4 font-semibold text-forest">Status</th>
                <th className="p-4 font-semibold text-forest">Action</th>
              </tr>
            </thead>
            <tbody>
              {lotBookings.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-muted">No active reservations for this lot.</td></tr>
              ) : (
                lotBookings.map(booking => (
                  <tr key={booking.id} className="border-b border-border last:border-0 hover-bg-mint transition-colors">
                    <td className="p-4 font-medium">{booking.id}</td>
                    <td className="p-4">{slots.find(s => s.id === booking.slotId)?.label}</td>
                    <td className="p-4">{new Date(booking.expectedArrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-4">
                      <span className={`badge ${booking.status === 'checked-in' ? 'badge-success' : 'badge-neutral'}`}>
                        {booking.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      {booking.status === 'checked-in' ? (
                        <button 
                          className="text-primary font-medium hover:underline"
                          onClick={() => navigate('CheckoutReceipt', { bookingId: booking.id })}
                        >
                          Checkout
                        </button>
                      ) : (
                        <button 
                          className="text-primary font-medium hover:underline"
                          onClick={() => navigate('OperatorVerification', { prefillId: booking.id })}
                        >
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

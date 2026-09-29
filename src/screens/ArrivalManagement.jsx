import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Clock, AlertTriangle, UserCheck, ShieldClose } from 'lucide-react';

export default function ArrivalManagement() {
  const { bookings, parkingLots, slots, updateBookingStatus, navigate } = useAppContext();

  // Find demo booking for arrival management (we prepopulated BKG-DEMO-1)
  const demoBooking = bookings.find(b => b.id === 'BKG-DEMO-1');

  if (!demoBooking) {
    return (
      <div className="text-center p-8">
        <p className="text-muted">No demo booking found for arrival management.</p>
        <button className="btn btn-outline mt-4" onClick={() => navigate('OperatorDashboard')}>Go Back</button>
      </div>
    );
  }

  const lot = parkingLots.find(l => l.id === demoBooking.lotId);
  const slot = slots.find(s => s.id === demoBooking.slotId);

  const simulateReminder = () => updateBookingStatus(demoBooking.id, 'awaiting-response');
  const simulateDelay = () => updateBookingStatus(demoBooking.id, 'confirmed-late');
  const simulateNoResponse = () => updateBookingStatus(demoBooking.id, 'released');
  const resetScenario = () => updateBookingStatus(demoBooking.id, 'reserved');

  return (
    <div className="fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-forest mb-2">Arrival Management</h2>
        <p className="text-muted">Manage drivers who miss their arrival window.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg text-forest">Scenario Subject</h3>
            <span className={`badge ${
              demoBooking.status === 'released' ? 'badge-error' : 
              demoBooking.status === 'confirmed-late' ? 'badge-success' : 
              demoBooking.status === 'awaiting-response' ? 'badge-warning' : 'badge-neutral'
            }`}>
              {demoBooking.status.replace('-', ' ')}
            </span>
          </div>
          
          <div className="space-y-3 text-sm text-charcoal mb-6 border-b border-border pb-4">
            <div className="flex justify-between">
              <span className="text-muted">Ref:</span>
              <span className="font-medium">{demoBooking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Driver:</span>
              <span className="font-medium">{demoBooking.driverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Lot/Slot:</span>
              <span className="font-medium">{lot?.name} - {slot?.label}</span>
            </div>
            <div className="flex justify-between text-warning">
              <span className="text-muted text-warning">Expected:</span>
              <span className="font-medium">{new Date(demoBooking.expectedArrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>

          <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6">
            <div className="relative">
              <div className={`absolute w-3 h-3 rounded-full -left-[1.65rem] top-1 ${demoBooking.status === 'reserved' ? 'bg-primary' : 'bg-muted'}`}></div>
              <p className="text-sm font-medium text-forest">Expected Arrival</p>
              <p className="text-xs text-muted">Grace period starts (15 mins)</p>
            </div>
            <div className="relative">
              <div className={`absolute w-3 h-3 rounded-full -left-[1.65rem] top-1 ${demoBooking.status === 'awaiting-response' ? 'bg-warning' : 'bg-muted'}`}></div>
              <p className="text-sm font-medium text-forest">Deadline Reached</p>
              <p className="text-xs text-muted">System asks for status</p>
            </div>
            <div className="relative">
              <div className={`absolute w-3 h-3 rounded-full -left-[1.65rem] top-1 ${demoBooking.status === 'confirmed-late' || demoBooking.status === 'released' ? (demoBooking.status === 'confirmed-late' ? 'bg-primary' : 'bg-error') : 'bg-muted'}`}></div>
              <p className="text-sm font-medium text-forest">Resolution</p>
              <p className="text-xs text-muted">{demoBooking.status === 'released' ? 'Slot released to public' : demoBooking.status === 'confirmed-late' ? 'Extension granted' : 'Pending response'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card bg-offwhite border-none">
            <h3 className="font-semibold text-forest mb-4">Simulation Controls</h3>
            
            <div className="space-y-3">
              <button 
                className="btn btn-outline w-full flex justify-start"
                onClick={simulateReminder}
                disabled={demoBooking.status === 'awaiting-response'}
              >
                <Clock size={18} className="text-warning" />
                1. Simulate Reminder (Awaiting Response)
              </button>
              
              <button 
                className="btn btn-outline w-full flex justify-start"
                onClick={simulateDelay}
                disabled={demoBooking.status !== 'awaiting-response'}
              >
                <UserCheck size={18} className="text-primary" />
                2a. Driver Confirms Delay (Extension)
              </button>
              
              <button 
                className="btn btn-outline w-full flex justify-start"
                onClick={simulateNoResponse}
                disabled={demoBooking.status !== 'awaiting-response'}
              >
                <ShieldClose size={18} className="text-error" />
                2b. Simulate No Response (Release Slot)
              </button>
            </div>
          </div>
          
          <button 
            className="btn btn-ghost w-full text-muted mt-4 border border-dashed border-border"
            onClick={resetScenario}
          >
            Reset Scenario
          </button>
        </div>
      </div>
    </div>
  );
}

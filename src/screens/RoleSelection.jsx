import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Car, ShieldCheck } from 'lucide-react';

export default function RoleSelection() {
  const { setRole, navigate } = useAppContext();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'driver') {
      navigate('DriverDashboard');
    } else {
      navigate('OperatorDashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-offwhite p-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 text-forest mb-4">
          <Car size={40} className="text-primary" />
          <h1 className="text-4xl font-bold">ParkEase</h1>
        </div>
        <p className="text-muted text-lg">Parking, without the uncertainty.</p>
        <span className="badge badge-neutral mt-4">Prototype Demo</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        <div 
          className="card card-interactive flex-1 flex flex-col items-center text-center p-8"
          onClick={() => handleRoleSelect('driver')}
        >
          <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center mb-4 text-primary">
            <Car size={32} />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-forest">Continue as Driver</h2>
          <p className="text-muted mb-6">Find and reserve parking spaces ahead of time.</p>
          <button className="btn btn-primary w-full mt-auto">Enter as Driver</button>
        </div>

        <div 
          className="card card-interactive flex-1 flex flex-col items-center text-center p-8"
          onClick={() => handleRoleSelect('operator')}
        >
          <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center mb-4 text-primary">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-forest">Continue as Operator</h2>
          <p className="text-muted mb-6">Manage lots, check-ins, and arrival windows.</p>
          <button className="btn btn-primary w-full mt-auto">Enter as Operator</button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Building, Hash, Users, Activity, Target, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { navigate, role } = useAppContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'ADMIN') {
      navigate('Login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/admin/analytics', {
          credentials: 'include'
        });
        
        if (res.ok) {
          setData(await res.json());
        } else if (res.status === 401 || res.status === 403) {
          navigate('Login');
        }
      } catch (e) {
        console.error('Failed to fetch admin analytics', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [role, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-surface rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-surface rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-red-600">Failed to load analytics</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="layout-container pb-24"
    >
      <header className="mb-12 mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold tracking-widest uppercase text-muted mb-2">Network Status</motion.h2>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-4xl md-text-5xl font-bold tracking-tight text-forest">ParkEase Intelligence</motion.h1>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 text-sm font-medium bg-mint px-4 py-2 rounded-full text-primary">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Live Network Sync
        </motion.div>
      </header>
      
      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Active Facilities', value: data.active_facilities, icon: Building },
          { label: 'Total Network Spaces', value: data.total_slots, icon: Hash },
          { label: 'Network Occupancy', value: `${Math.round(((data.slot_counts.OCCUPIED || 0) / (data.total_slots || 1)) * 100)}%`, icon: Target },
          { label: 'Total Volume (INR)', value: `₹${parseFloat(data.confirmed_booking_value || 0).toFixed(0)}`, icon: Activity }
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={kpi.label}
            className="flex flex-col border-l-2 border-border pl-6 py-2"
          >
            <div className="flex items-center gap-2 text-muted mb-3">
              <kpi.icon size={16} />
              <span className="text-sm font-semibold uppercase tracking-wider">{kpi.label}</span>
            </div>
            <span className="text-5xl font-bold text-forest tracking-tighter">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Network Utilization */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <h3 className="text-2xl font-bold text-forest mb-8">Slot Utilization</h3>
          <div className="flex flex-col gap-6">
            {[
              { label: 'Available', count: data.slot_counts.AVAILABLE || 0, color: 'bg-primary' },
              { label: 'Occupied', count: data.slot_counts.OCCUPIED || 0, color: 'bg-forest' },
              { label: 'Reserved', count: data.slot_counts.RESERVED || 0, color: 'bg-warning' }
            ].map(status => (
              <div key={status.label}>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-semibold text-charcoal">{status.label}</span>
                  <span className="text-xl font-bold text-muted">{status.count} <span className="text-sm font-normal">slots</span></span>
                </div>
                <div className="h-3 w-full bg-surface rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(status.count / (data.total_slots || 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${status.color}`}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Quick Management Links */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-2xl font-bold text-forest mb-8">Management</h3>
          <div className="flex flex-col gap-4">
            {[
              { route: 'AdminFacilities', label: 'Facilities Infrastructure', desc: 'Manage parking locations' },
              { route: 'AdminOperators', label: 'Operator Network', desc: 'Manage portal access' },
              { route: 'AdminPricing', label: 'Pricing Intelligence', desc: 'Configure dynamic rates' }
            ].map(link => (
              <div 
                key={link.route}
                onClick={() => navigate(link.route)}
                className="group cursor-pointer p-6 rounded-2xl border border-border hover:border-primary hover:shadow-md transition-all bg-white"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg text-forest group-hover:text-primary transition-colors">{link.label}</h4>
                  <ArrowUpRight size={20} className="text-muted group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
                <p className="text-sm text-muted font-medium">{link.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

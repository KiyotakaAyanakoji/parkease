import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Car, MapPin, Search, ArrowRight, ShieldCheck, Clock, Navigation, CheckCircle, ChevronRight, Activity, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// Reusable cinematic reveal component
const CinematicReveal = ({ children, delay = 0, yOffset = 30, direction = "up", width = "100%", className = "" }) => {
  const yStart = direction === "up" ? yOffset : direction === "down" ? -yOffset : 0;
  const xStart = direction === "left" ? yOffset : direction === "right" ? -yOffset : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: yStart, x: xStart }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={{ width }}
    >
      {children}
    </motion.div>
  );
};

export default function LandingPage() {
  const { navigate } = useAppContext();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="bg-white min-h-screen text-forest font-sans selection:bg-primary/30 selection:text-forest overflow-x-hidden">
      
      {/* Sticky Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 transition-all border-b border-border/0"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottomColor: useTransform(scrollYProgress, [0, 0.05], ['rgba(0,0,0,0)', 'rgba(226,232,240,1)'])
        }}
      >
        <div className="layout-container h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center group-hover:bg-primary transition-colors">
              <Car size={20} />
            </div>
            <span className="font-bold text-2xl tracking-tight">ParkEase</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#experience" className="text-sm font-semibold tracking-wide hover:text-primary transition-colors">Experience</a>
            <a href="#operations" className="text-sm font-semibold tracking-wide hover:text-primary transition-colors">Operations</a>
            <a href="#intelligence" className="text-sm font-semibold tracking-wide hover:text-primary transition-colors">Intelligence</a>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="hidden md:block text-sm font-bold hover:text-primary transition-colors" onClick={() => navigate('Login')}>Sign In</button>
            <button className="bg-forest text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-primary transition-all shadow-md hover:shadow-lg" onClick={() => navigate('Login')}>
              Find Parking
            </button>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[95vh] flex items-center pt-20 overflow-hidden bg-offwhite">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] mix-blend-multiply"></div>
          <div className="absolute bottom-0 left-1/3 w-[800px] h-[400px] bg-forest/5 rounded-full blur-[100px] mix-blend-multiply"></div>
        </div>

        <motion.div 
          className="layout-container relative z-10 flex flex-col items-center text-center"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-border px-4 py-2 rounded-full mb-8 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest uppercase">The Mobility Network</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1.05] mb-8 max-w-5xl mx-auto">
            Find a space.<br />
            <span className="text-primary">Book it.</span><br />
            Park without the hassle.
          </h1>

          <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto leading-relaxed mb-12">
            The definitive platform for urban mobility. Seamless discovery, instant booking, and guaranteed arrival coordination.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => navigate('Login')}
              className="bg-forest text-white px-8 py-5 rounded-full text-lg font-bold hover:bg-primary transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 group"
            >
              Start discovering
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* SECTION 01: THE PROBLEM */}
      <section className="py-32 bg-forest text-white">
        <div className="layout-container text-center max-w-4xl">
          <CinematicReveal>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-8 text-offwhite">
              Finding parking shouldn't be the hardest part of getting there.
            </h2>
            <p className="text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
              We replaced circling blocks and unpredictable availability with digital certainty. Your spot is secured before you even turn the key.
            </p>
          </CinematicReveal>
        </div>
      </section>

      {/* SECTION 02 & 03: FIND & CHOOSE */}
      <section id="experience" className="py-32">
        <div className="layout-container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Visual Side */}
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-mint to-offwhite rounded-3xl -rotate-3 scale-105 origin-center -z-10"></div>
              
              <div className="bg-white rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-border flex justify-between items-center bg-offwhite">
                  <div className="flex items-center gap-3">
                    <Search className="text-muted" size={20} />
                    <div className="h-6 w-32 bg-white rounded-md border border-border"></div>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-mint flex items-center justify-center">
                    <MapPin size={12} className="text-primary" />
                  </div>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                  {[1, 2].map((i) => (
                    <CinematicReveal key={i} delay={0.2 * i} direction="left" className="bg-white border border-border rounded-xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <div className="h-4 w-40 bg-forest/10 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-forest/5 rounded"></div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-primary font-bold text-lg mb-1">{20 - (i*5)} <span className="text-xs uppercase text-muted tracking-wide">Spaces</span></span>
                        <div className="h-8 w-8 rounded-full bg-forest text-white flex items-center justify-center"><ChevronRight size={16}/></div>
                      </div>
                    </CinematicReveal>
                  ))}
                  
                  {/* Slot Grid Mock */}
                  <CinematicReveal delay={0.6} direction="left" className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-4 gap-2">
                       {[...Array(8)].map((_, idx) => (
                         <div key={idx} className={`h-16 rounded-md border-2 ${idx === 2 ? 'border-primary bg-primary/10' : idx === 5 ? 'border-border bg-offwhite' : 'border-forest bg-forest text-white flex items-center justify-center'} transition-colors`}>
                           {idx === 5 ? '' : idx === 2 ? '' : <Car size={24} className="opacity-50" />}
                         </div>
                       ))}
                    </div>
                  </CinematicReveal>
                </div>
              </div>
            </div>

            {/* Text Side */}
            <div className="order-1 md:order-2">
              <CinematicReveal>
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-10 h-10 rounded-full bg-mint text-primary font-bold flex items-center justify-center">1</span>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-muted">Discovery & Selection</h3>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Total visibility before you arrive.</h2>
                <p className="text-lg text-muted leading-relaxed mb-8">
                  Browse facilities based on real-time proximity and live occupancy. Step inside the facility digitally to select the exact parking slot you want.
                </p>
                <ul className="space-y-4">
                  {['Live occupancy tracking', 'Spatial floor-plan selection', 'Transparent pricing layers'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 font-semibold text-charcoal">
                      <CheckCircle size={20} className="text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CinematicReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04 & 05: BOOK & ARRIVE */}
      <section className="py-32 bg-offwhite border-y border-border">
        <div className="layout-container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            <div className="order-1">
              <CinematicReveal>
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-10 h-10 rounded-full bg-forest text-white font-bold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-muted">Booking & Arrival</h3>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Your digital parking pass.</h2>
                <p className="text-lg text-muted leading-relaxed mb-8">
                  Lock in your reservation. Your phone becomes your secure access pass. The facility expects you, and a grace period protects you if traffic hits.
                </p>
                <button className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all uppercase tracking-widest text-sm">
                  View Driver Experience <ArrowRight size={16} />
                </button>
              </CinematicReveal>
            </div>

            <div className="order-2 flex justify-center relative">
               <div className="absolute inset-0 bg-primary/10 rounded-full blur-[80px] -z-10 w-3/4 mx-auto"></div>
               <CinematicReveal delay={0.2} direction="up" className="w-full max-w-sm">
                 <div className="bg-forest text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                   {/* Decorative */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary blur-3xl opacity-30 -mr-10 -mt-10 rounded-full"></div>
                   
                   <div className="text-center border-b border-white/20 pb-6 mb-6">
                     <span className="text-xs uppercase tracking-widest font-bold text-primary mb-2 block">Confirmed Pass</span>
                     <h4 className="text-2xl font-bold">Central Plaza</h4>
                     <p className="text-white/60">Slot A04</p>
                   </div>
                   
                   <div className="flex justify-between items-center mb-10">
                     <div>
                       <span className="block text-xs uppercase tracking-widest text-white/50 mb-1">Expected</span>
                       <span className="text-xl font-bold">14:30</span>
                     </div>
                     <div className="text-right">
                       <span className="block text-xs uppercase tracking-widest text-white/50 mb-1">Vehicle</span>
                       <span className="text-xl font-bold">MH01 AB 1234</span>
                     </div>
                   </div>

                   <div className="bg-white p-4 rounded-xl flex items-center justify-center aspect-square shadow-inner">
                     {/* Simulated QR Code structure */}
                     <div className="w-full h-full border-4 border-forest rounded-lg relative grid grid-cols-5 grid-rows-5 gap-1 p-2">
                       <div className="col-span-2 row-span-2 bg-forest rounded-sm"></div>
                       <div className="col-start-4 col-span-2 row-span-2 bg-forest rounded-sm"></div>
                       <div className="col-span-2 row-start-4 row-span-2 bg-forest rounded-sm"></div>
                       <div className="col-start-3 row-start-3 bg-forest rounded-sm"></div>
                       <div className="col-start-4 row-start-4 bg-primary rounded-sm"></div>
                       <div className="col-start-5 row-start-5 bg-forest rounded-sm"></div>
                     </div>
                   </div>
                 </div>
               </CinematicReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 06: OPERATIONS */}
      <section id="operations" className="py-32">
        <div className="layout-container text-center mb-16 md:mb-20">
          <CinematicReveal>
            <span className="text-sm font-bold tracking-widest uppercase text-primary mb-4 block">Facility Operations</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">The live operations cockpit.</h2>
          </CinematicReveal>
        </div>

        <div className="layout-container max-w-5xl">
          <div className="bg-white rounded-3xl border border-border shadow-2xl p-4 md:p-8">
             {/* Mock Operator Dashboard */}
             <div className="border border-border rounded-2xl bg-offwhite p-6 overflow-hidden relative">
               <div className="flex justify-between items-end mb-10 pb-6 border-b border-border">
                 <div>
                   <h3 className="text-2xl font-bold text-forest mb-1">Central Plaza Hub</h3>
                   <p className="text-sm text-muted font-medium uppercase tracking-widest">Live Cockpit</p>
                 </div>
                 <div className="text-right">
                   <span className="text-4xl font-bold text-forest">72%</span>
                   <span className="block text-xs font-bold uppercase text-muted tracking-widest">Occupied</span>
                 </div>
               </div>

               <div className="flex flex-col gap-4">
                 {[
                   { time: "14:20", car: "MH01 AB 1234", slot: "A04", status: "RESERVED", action: "Check In", color: "bg-primary text-white" },
                   { time: "12:15", car: "DL02 CD 5678", slot: "B12", status: "CHECKED IN", action: "Check Out", color: "bg-forest text-white" }
                 ].map((row, i) => (
                   <CinematicReveal key={i} delay={0.2 * i} direction="left" className="bg-white p-4 rounded-xl border border-border flex items-center justify-between shadow-sm">
                     <div className="flex items-center gap-6">
                       <span className="text-xl font-bold text-forest">{row.time}</span>
                       <div className="h-8 w-px bg-border"></div>
                       <div>
                         <span className="font-bold text-charcoal block">{row.car}</span>
                         <span className="text-xs text-muted">Slot {row.slot}</span>
                       </div>
                     </div>
                     <button className={`px-6 py-2 rounded-lg font-bold text-sm ${row.color}`}>
                       {row.action}
                     </button>
                   </CinematicReveal>
                 ))}
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 07: INTELLIGENCE */}
      <section id="intelligence" className="py-32 bg-forest text-white">
        <div className="layout-container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "14", label: "Active Facilities", icon: Zap },
                  { value: "1,240", label: "Network Spaces", icon: Activity },
                  { value: "86%", label: "Peak Occupancy", icon: ShieldCheck },
                  { value: "Live", label: "Dynamic Pricing", icon: ArrowRight }
                ].map((kpi, i) => (
                  <CinematicReveal key={i} delay={0.1 * i} direction="up" className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <kpi.icon size={24} className="text-primary mb-4" />
                    <span className="block text-4xl font-bold mb-1">{kpi.value}</span>
                    <span className="text-xs uppercase tracking-widest text-white/50 font-bold">{kpi.label}</span>
                  </CinematicReveal>
                ))}
              </div>
            </div>

            <div className="order-1 md:order-2">
              <CinematicReveal>
                <span className="text-sm font-bold tracking-widest uppercase text-primary mb-4 block">Network Administration</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-offwhite">Macro intelligence.</h2>
                <p className="text-lg text-white/60 leading-relaxed mb-8">
                  Monitor network health, analyze facility performance, and configure dynamic pricing rules from a centralized command center.
                </p>
                <button className="text-white font-bold flex items-center gap-2 hover:gap-4 transition-all uppercase tracking-widest text-sm hover:text-primary">
                  View Admin Console <ArrowRight size={16} />
                </button>
              </CinematicReveal>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-40 bg-offwhite flex items-center justify-center text-center">
        <CinematicReveal className="layout-container max-w-3xl">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Your parking spot.<br/>
            Ready when you are.
          </h2>
          <button 
            onClick={() => navigate('Login')}
            className="bg-forest text-white px-10 py-6 rounded-full text-xl font-bold hover:bg-primary transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2"
          >
            Find Parking Now
          </button>
        </CinematicReveal>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-white">
        <div className="layout-container flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forest text-white flex items-center justify-center">
              <Car size={16} />
            </div>
            <span className="font-bold text-xl tracking-tight text-forest">ParkEase</span>
          </div>
          <div className="text-sm text-muted font-medium">
            &copy; {new Date().getFullYear()} ParkEase Mobility Network. Prototype Demo.
          </div>
        </div>
      </footer>
    </div>
  );
}

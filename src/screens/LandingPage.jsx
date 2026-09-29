import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Car, MapPin, Search, ArrowRight, ShieldCheck, Clock, Navigation } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './LandingPage.css';

const Reveal = ({ children, delay = 0, y = 20, className = "", style = {} }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
    style={{ ...style, width: '100%' }}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const { navigate } = useAppContext();
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="lp-wrapper">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="lp-nav"
      >
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <Car size={16} />
          </div>
          <span className="font-bold text-xl tracking-tight text-forest">ParkEase</span>
        </div>
        
        <div className="lp-nav-links">
          <a href="#how-it-works" className="text-muted hover-text-forest transition-colors relative group">
            How it works
            <span className="absolute left-0 right-0 -bottom-1 h-[2px] bg-primary scale-x-0 group-hover-scale-x-100 transition-transform origin-left ease-out"></span>
          </a>
          <a href="#for-operators" className="text-muted hover-text-forest transition-colors relative group">
            For operators
            <span className="absolute left-0 right-0 -bottom-1 h-[2px] bg-primary scale-x-0 group-hover-scale-x-100 transition-transform origin-left ease-out"></span>
          </a>
          <button 
            className="text-forest hover-text-primary transition-colors"
            onClick={() => navigate('RoleSelection')}
          >
            Log in
          </button>
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={() => navigate('RoleSelection')}
        >
          Find parking
        </button>
      </motion.nav>

      {/* Hero Section */}
      <section className="lp-hero relative">
        <div 
          className="pointer-events-none fixed top-0 left-0 w-full h-full z-0 overflow-hidden mix-blend-multiply opacity-50 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, var(--color-mint), transparent 40%)`,
            display: window.matchMedia("(hover: hover)").matches ? 'block' : 'none'
          }}
        />
        
        <div className="lp-container lp-grid-2 relative z-10">
          <div className="lp-hero-text">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md-text-7xl font-bold tracking-tight text-forest mb-6"
              style={{ lineHeight: 1.1, width: '100%' }}
            >
              Your parking spot.<br/>
              <span className="text-primary">Ready when you are.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md-text-xl text-muted mb-8 max-w-md leading-relaxed"
            >
              Find available parking, reserve your spot, and arrive with a plan. Less circling, more getting where you're going.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lp-buttons"
            >
              <button 
                onClick={() => navigate('RoleSelection')}
                className="btn btn-primary text-base px-8 py-4 shadow-lg hover-shadow-xl hover-translate-y transition-all"
              >
                Find parking
              </button>
              <a 
                href="#how-it-works"
                className="btn btn-outline border-border text-forest text-base px-8 py-4 text-center"
              >
                See how it works
              </a>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lp-hero-visual relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-mint rounded-full opacity-70 pointer-events-none" style={{ filter: 'blur(80px)', transform: 'translate(25%, -50%)' }}></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-lime rounded-full opacity-40 pointer-events-none" style={{ filter: 'blur(80px)', transform: 'translate(-25%, 50%)' }}></div>
            
            <div className="relative z-10 w-full rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-sm shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary"/>
                  <span className="font-semibold text-sm">Central Plaza Parking</span>
                </div>
                <span className="text-xs bg-white px-2 py-1 rounded-full text-forest font-medium border border-border">Available</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs text-muted block mb-1">Slot</span>
                  <span className="text-2xl font-bold text-forest">A04</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted block mb-1">Price</span>
                  <span className="text-sm font-bold text-forest">₹50/hr</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-primary text-white rounded-2xl p-4 shadow-xl flex flex-col gap-2 mt-auto" style={{ width: '85%', marginLeft: 'auto' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Reserved</span>
                <CheckCircleIcon />
              </div>
              <span className="text-lg font-semibold">Arriving in 12 mins</span>
              <div className="w-full h-1 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                <div className="h-full bg-white rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="lp-section lp-container">
        <Reveal>
          <div className="mb-16 text-center max-w-2xl mx-auto w-full">
            <h2 className="text-4xl md-text-5xl font-bold mb-4 tracking-tight">The city moves.<br/>Your parking is already planned.</h2>
            <p className="text-lg text-muted">A seamless experience from finding a spot to arriving with confidence.</p>
          </div>
        </Reveal>

        <div className="lp-grid-3 relative w-full">
          {[
            { step: 1, title: "Find", desc: "Explore available parking options and verify real-time availability before you head out.", icon: <Search size={24}/> },
            { step: 2, title: "Reserve", desc: "Choose a suitable slot, select your expected arrival time, and reserve it instantly.", icon: <MapPin size={24}/> },
            { step: 3, title: "Arrive", desc: "Use your booking details to coordinate arrival. We handle the grace periods and extensions.", icon: <Navigation size={24}/> }
          ].map((s, i) => (
            <Reveal key={s.step} delay={0.1 * i} className="lp-step-card">
              <div className="w-16 h-16 rounded-2xl bg-mint flex items-center justify-center text-primary mb-6 shadow-sm border border-white">
                {s.icon}
              </div>
              <span className="text-sm font-semibold tracking-widest uppercase text-muted mb-2">Step {s.step}</span>
              <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
              <p className="text-muted leading-relaxed">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="lp-benefits lp-section">
        <div className="lp-container lp-grid-2">
          <Reveal className="w-full relative" style={{ order: 2 }}>
            <div className="lp-benefits-visual">
              <div className="absolute inset-0 bg-gradient-tr pointer-events-none"></div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-border z-10 relative mb-8" style={{ width: '85%' }}>
                <div className="flex gap-4 items-center mb-4 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Running late?</h4>
                    <p className="text-sm text-muted">15 min grace period</p>
                  </div>
                </div>
                <button className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold transition-colors">
                  Request Extension
                </button>
              </div>
              
              <div className="bg-offwhite p-5 rounded-2xl shadow-xl border border-border absolute z-20" style={{ width: '80%', bottom: '32px', right: '32px' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Check-in confirmed</span>
                  <ShieldCheck size={18} className="text-primary"/>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full"></div>
                </div>
              </div>
            </div>
          </Reveal>
          
          <Reveal className="w-full" style={{ order: 1 }}>
            <h2 className="text-4xl md-text-5xl font-bold mb-6 tracking-tight">Focus on the destination.</h2>
            <div className="space-y-6">
              <p className="text-lg text-muted leading-relaxed">
                We remove the uncertainty of arriving at a full lot. Keep your reservation details in one place and let us handle the coordination with the parking operator.
              </p>
              <ul className="space-y-4 mt-6">
                {['Real-time availability updates', 'One-tap extension requests', 'Digital receipt generation'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-charcoal">
                    <div className="w-6 h-6 rounded-full bg-sage flex items-center justify-center text-primary shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Operator Section */}
      <section id="for-operators" className="lp-section lp-container">
        <div className="lp-grid-2">
          <Reveal className="w-full">
            <span className="text-sm font-semibold tracking-widest uppercase text-primary mb-4 block">For Operators</span>
            <h2 className="text-4xl md-text-5xl font-bold mb-6 tracking-tight">Full visibility.<br/>Total control.</h2>
            <p className="text-lg text-muted leading-relaxed mb-8">
              Manage parking lots, view incoming reservations, and coordinate check-ins effortlessly. 
              Our arrival management system automatically handles expected delays and slot releases.
            </p>
            <button 
              className="btn btn-outline border-border text-forest group transition-all"
              onClick={() => navigate('RoleSelection')}
            >
              Enter Operator Portal
              <ArrowRight size={16} className="ml-2 inline-block transition-transform group-hover-translate-x" />
            </button>
          </Reveal>
          
          <Reveal delay={0.2} className="w-full">
            <div className="lp-operator-visual">
              <div className="absolute top-0 right-10 w-32 h-32 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(39, 155, 105, 0.3)', filter: 'blur(50px)' }}></div>
              
              <div className="bg-white rounded-2xl p-6 shadow-inner relative z-10">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                  <h4 className="font-semibold text-lg">Occupancy Overview</h4>
                  <span className="text-sm font-bold bg-mint text-primary px-3 py-1 rounded-full">75%</span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Occupied</span>
                    <span className="font-semibold">45 slots</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Reserved</span>
                    <span className="font-semibold text-warning">15 slots</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Available</span>
                    <span className="font-semibold text-primary">20 slots</span>
                  </div>
                </div>
                
                <div className="w-full h-4 bg-offwhite rounded-full overflow-hidden flex">
                  <div className="h-full bg-charcoal" style={{ width: '55%' }}></div>
                  <div className="h-full bg-warning opacity-80" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp-section lp-container">
        <Reveal className="lp-final-cta">
          <div className="relative z-10">
            <h2 className="text-4xl md-text-6xl font-bold mb-6 tracking-tight">Ready to park easier?</h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Skip the search. Reserve your spot today and experience parking as it should be.
            </p>
            <button 
              className="bg-white text-forest px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover-translate-y transition-all inline-flex items-center gap-2 mx-auto"
              style={{ display: 'inline-flex', justifyContent: 'center' }}
              onClick={() => navigate('RoleSelection')}
            >
              Find parking now
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border text-center lp-container">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Car size={20} className="text-primary" />
            <span className="font-bold text-xl tracking-tight">ParkEase</span>
          </div>
          <div className="text-sm text-muted">
            &copy; {new Date().getFullYear()} ParkEase. Prototype Demo.
          </div>
        </div>
      </footer>
    </div>
  );
}

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

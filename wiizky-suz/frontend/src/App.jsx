import React, { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from './firebase';
import OrderForm from './components/OrderForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard'; // <-- NEW: IMPORTING ADMIN

// --- CUSTOM SVGS ---
const svgs = {
  heart: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  user: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  thumbsUp: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>,
  bell: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>,
  eye: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>,
  users: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  home: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>,
  history: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>,
  menu: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
};

const platformCards = [
  { id: 'instagram', name: 'Instagram', price: '₹8', gradient: 'bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]', bannerBg: 'from-purple-600 via-pink-500 to-orange-400', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.88z"/></svg>, bubble1: { icon: svgs.heart, bg: 'bg-white', color: 'text-pink-500' }, bubble2: { icon: svgs.user, bg: 'bg-blue-500', color: 'text-white' }},
  { id: 'facebook', name: 'Facebook', price: '₹5', gradient: 'bg-gradient-to-br from-blue-600 to-blue-400', bannerBg: 'from-blue-800 via-blue-600 to-blue-500', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, bubble1: { icon: svgs.thumbsUp, bg: 'bg-blue-100', color: 'text-blue-600' }, bubble2: { icon: svgs.user, bg: 'bg-gray-800', color: 'text-white' }},
  { id: 'youtube', name: 'YouTube', price: '₹20', gradient: 'bg-gradient-to-br from-red-700 to-red-500', bannerBg: 'from-red-800 via-red-600 to-red-500', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, bubble1: { icon: svgs.thumbsUp, bg: 'bg-gray-900', color: 'text-white' }, bubble2: { icon: svgs.bell, bg: 'bg-red-100', color: 'text-red-600' }},
  { id: 'tiktok', name: 'Tiktok', price: '₹6', gradient: 'bg-gradient-to-br from-gray-900 to-gray-700', bannerBg: 'from-gray-900 via-gray-800 to-gray-600', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>, bubble1: { icon: svgs.heart, bg: 'bg-pink-500', color: 'text-white' }, bubble2: { icon: svgs.user, bg: 'bg-cyan-400', color: 'text-gray-900' }},
  { id: 'telegram', name: 'Telegram', price: '₹10', gradient: 'bg-gradient-to-br from-blue-500 to-cyan-400', bannerBg: 'from-blue-600 via-cyan-500 to-cyan-400', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>, bubble1: { icon: svgs.eye, bg: 'bg-white', color: 'text-blue-500' }, bubble2: { icon: svgs.users, bg: 'bg-blue-900', color: 'text-white' }}
];

// --- RESPONSIVE SHAPE-SHIFTING HERO BANNER ---
const HeroBanner = ({ onStartClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => { setActiveIndex((prev) => (prev + 1) % platformCards.length); }, 2500);
    return () => clearInterval(interval);
  }, []);

  const activeCard = platformCards[activeIndex];

  return (
    <div className="relative w-full overflow-hidden mb-8 md:mb-12 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
      {platformCards.map((card, index) => (
        <div key={card.id + '_bg'} className={`absolute inset-0 bg-gradient-to-r ${card.bannerBg} transition-opacity duration-1000 ease-in-out ${activeIndex === index ? 'opacity-100' : 'opacity-0'}`}></div>
      ))}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 md:px-8 lg:px-16 pt-10 pb-8 md:py-16 flex flex-col-reverse md:flex-row items-center justify-between">
        <div className="w-full md:w-1/2 text-center md:text-left mt-6 md:mt-0">
          <h1 className="text-[1.75rem] md:text-[3.5rem] font-black text-white mb-3 md:mb-6 leading-tight drop-shadow-md">
            Boost Your Social Media Growth
          </h1>
          <p className="text-sm md:text-xl text-white/90 mb-5 md:mb-8 font-medium px-1 md:px-0 leading-relaxed">
            Get instant followers, likes, views & more for Instagram, YouTube, TikTok, and Facebook.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 justify-center md:justify-start">
            <button onClick={onStartClick} className="w-full sm:w-auto bg-white text-gray-900 font-extrabold text-sm md:text-lg px-6 py-3.5 md:py-4 rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:-translate-y-1 transition-all duration-300">
              Start Growing Now
            </button>
            <button onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto bg-white/20 backdrop-blur-md border border-white/40 text-white font-bold text-sm md:text-lg px-6 py-3.5 md:py-4 rounded-xl hover:bg-white/30 transition-all duration-300">
              View Our Services →
            </button>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 md:w-64 md:h-64 animate-[bounce_2.5s_infinite] mb-4 md:mb-6">
            <div className={`absolute inset-0 ${activeCard.gradient} rounded-[1.5rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-center border-4 border-white/30 backdrop-blur-sm transform rotate-6 transition-all duration-700 ease-in-out p-5 md:p-12`}>
              <div className="w-full h-full text-white drop-shadow-2xl transition-all duration-700 ease-in-out transform scale-125 md:scale-150 flex items-center justify-center">{activeCard.icon}</div>
            </div>
            <div className={`absolute -bottom-3 -left-3 md:-bottom-6 md:-left-6 ${activeCard.bubble1.bg} ${activeCard.bubble1.color} rounded-xl md:rounded-3xl w-10 h-10 md:w-16 md:h-16 p-2 md:p-3.5 shadow-2xl animate-pulse transform -rotate-12 border border-white/50 transition-all duration-700 ease-in-out`}>{activeCard.bubble1.icon}</div>
            <div className={`absolute -top-3 -right-3 md:-top-6 md:-right-6 ${activeCard.bubble2.bg} ${activeCard.bubble2.color} rounded-xl md:rounded-3xl w-10 h-10 md:w-16 md:h-16 p-2 md:p-3.5 shadow-2xl transform rotate-12 border-2 border-white/50 transition-all duration-700 ease-in-out`}>{activeCard.bubble2.icon}</div>
          </div>
          <div className="absolute -bottom-2 md:-bottom-10 w-24 md:w-56 h-3 md:h-6 bg-black/30 blur-lg rounded-[100%] animate-[pulse_2.5s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('hub'); 
  const [showAuth, setShowAuth] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- GOD MODE: ADMIN CHECK ---
  // ADD YOUR ACTUAL EMAIL HERE TO GIVE YOURSELF ADMIN POWERS!
  const adminEmails = ['demo@wiizky.com', 'admin@wiizky.com']; 
  const isAdmin = user && adminEmails.includes(user.email);

  const syncUser = async (u, defaultName, defaultPic) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: u.uid, name: u.displayName || defaultName, email: u.email, profilePicture: u.photoURL || defaultPic })
      });
      const data = await response.json();
      if (data.success) { setUser(data.user); setShowAuth(false); }
    } catch (error) { console.error("Login Failed:", error.message); }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUser(result.user, result.user.displayName, result.user.photoURL);
    } catch (error) { console.error(error); }
  };

  const handleGuestLogin = () => {
    setUser({ _id: 'guest_12345', name: 'Admin Demo', email: 'demo@wiizky.com', role: 'user', profilePicture: 'https://ui-avatars.com/api/?name=A&background=A855F7&color=fff' });
    setShowAuth(false);
  };

  const handleManualLogin = async (u) => {
    await syncUser(u, u.email.split('@')[0], `https://ui-avatars.com/api/?name=${u.email.charAt(0)}&background=A855F7&color=fff`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 font-sans pb-24 md:pb-10">
      
      {/* GLOBAL NAVBAR */}
      <div className="w-full bg-white border-b border-gray-200 py-3 px-4 md:px-8 flex flex-col gap-3 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-700 hover:text-gray-900 transition-colors">
            {svgs.menu}
          </button>
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer justify-center flex-1 md:flex-none md:justify-start" onClick={() => setCurrentView('hub')}>
            <img src="/logo.jpg" alt="Wiizky Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover shadow-sm border border-gray-100" />
            <h1 className="text-base sm:text-lg md:text-2xl font-black text-gray-900 tracking-tight">
              Wiizky <span className="text-blue-600">Social Media</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-lg px-4 py-2 flex-1 max-w-md mx-8 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-sm">
            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" placeholder="Search products..." className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-500 font-medium" />
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 border border-gray-200 p-1 pr-3 md:pr-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors shadow-sm" onClick={() => setUser(null)} title="Click to Logout">
                <img src={user.profilePicture} alt="Profile" referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg border border-gray-100" />
                <span className="hidden sm:block text-sm font-extrabold text-gray-900">{user.name}</span>
              </div>
            ) : (
              <>
                <button onClick={() => setShowAuth(true)} className="text-gray-600 font-bold hover:text-gray-900 text-sm md:text-base transition-colors hidden sm:block">Sign In</button>
                <button onClick={() => setShowAuth(true)} className="bg-gray-900 text-white font-bold px-4 py-2 md:px-5 md:py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-md text-sm md:text-base">Get Started</button>
              </>
            )}
          </div>
        </div>
        <div className="md:hidden flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-full focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
          <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" placeholder="Search products..." className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-500 font-medium" />
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-64 max-w-[80%] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
                <span className="font-black text-lg text-gray-900">
                  Wiizky <span className="text-blue-600">Social Media</span>
                </span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-900 bg-white p-1 rounded-md shadow-sm border border-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex flex-col p-4 gap-1 overflow-y-auto">
              <button onClick={() => { setCurrentView('hub'); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3.5 rounded-xl transition-colors">Home Hub</button>
              {user && <button onClick={() => { setCurrentView('history'); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3.5 rounded-xl transition-colors">Order History</button>}
              
              {/* ADMIN SECRET MOBILE MENU LINK */}
              {isAdmin && (
                <button onClick={() => { setCurrentView('admin'); setIsMobileMenuOpen(false); }} className="text-left font-black text-purple-600 hover:bg-purple-50 px-4 py-3.5 rounded-xl transition-colors">
                  👑 Admin Dashboard
                </button>
              )}

              <div className="h-px bg-gray-100 my-2"></div>
              
              <button onClick={() => { alert('About Us page coming soon!'); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3.5 rounded-xl transition-colors">About Us</button>
              <button onClick={() => { alert('Contact Us page coming soon!'); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3.5 rounded-xl transition-colors">Contact Us</button>
              <button onClick={() => { alert('Terms & Conditions coming soon!'); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3.5 rounded-xl transition-colors">Terms & Conditions</button>
              
              {user && (
                <>
                  <div className="h-px bg-gray-100 my-2"></div>
                  <button onClick={() => { setUser(null); setIsMobileMenuOpen(false); }} className="text-left font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-3.5 rounded-xl transition-colors">Logout</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {showAuth && !user ? (
        <div className="w-full flex flex-col items-center justify-center my-auto min-h-[80vh] px-4 animate-in zoom-in-95 duration-300">
          <div className="mb-6 w-full max-w-md mt-6">
            <button onClick={() => setShowAuth(false)} className="text-gray-500 font-bold hover:text-gray-900 transition-colors">← Back to Home</button>
          </div>
          <Login onGoogleLogin={handleGoogleLogin} onGuestLogin={handleGuestLogin} onManualLogin={handleManualLogin} />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          
          {/* DESKTOP SUB-NAVIGATION WITH SECRET ADMIN BUTTON */}
          {user && !showAuth && (
            <div className="hidden md:flex w-full justify-center mt-8 mb-2">
              <div className="flex gap-1 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                <button onClick={() => setCurrentView('hub')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${(currentView === 'hub' || currentView === 'order_instagram') ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Home Hub</button>
                <button onClick={() => setCurrentView('history')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${currentView === 'history' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Order History</button>
                
                {/* ADMIN ONLY DESKTOP PILL */}
                {isAdmin && (
                  <button onClick={() => setCurrentView('admin')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${currentView === 'admin' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-500 hover:text-purple-600'}`}>
                    👑 Admin Panel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ADMIN VIEW RENDERING */}
          {currentView === 'admin' && isAdmin && (
             <div className="mt-4 md:mt-8 w-full"><AdminDashboard /></div>
          )}

          {currentView === 'hub' && (
            <div className="w-full animate-in fade-in duration-500 flex flex-col items-center">
              <HeroBanner onStartClick={() => {
                if(!user) setShowAuth(true);
                else document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
              }} />

              <div className="w-full max-w-6xl px-4">
                <div id="services" className="text-center mb-6 md:mb-10">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 md:mb-3 tracking-tight">Our Services</h2>
                  <p className="text-gray-500 font-medium text-sm md:text-lg">Explore our wide range of social media growth services</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-12 md:mb-20">
                  {platformCards.map((card) => (
                    <button key={card.id} onClick={() => { 
                        if(!user) setShowAuth(true);
                        else if(card.id === 'instagram') setCurrentView('order_instagram'); 
                        else alert(`${card.name} coming soon!`); 
                      }} className={`relative overflow-hidden text-left rounded-xl md:rounded-2xl p-4 md:p-8 h-36 md:h-56 ${card.gradient} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group`}>
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <h3 className="text-base md:text-2xl font-bold text-white mb-0.5 md:mb-1 drop-shadow-sm truncate">{card.name}</h3>
                          <p className="text-white/90 text-[10px] md:text-sm font-semibold">from {card.price}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md border border-white/40 rounded-lg md:rounded-xl px-3 py-1.5 md:px-5 md:py-2.5 w-max flex items-center gap-1 md:gap-2 text-white text-[10px] md:text-sm font-bold shadow-sm">
                          Shop <span className="hidden sm:inline">Now</span> <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </div>
                      <div className="absolute -right-3 md:-right-6 top-1/2 -translate-y-1/2 opacity-90 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 drop-shadow-xl">
                        <div className="w-16 h-16 md:w-28 md:h-28 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center transform rotate-12 border border-white/30 p-3 md:p-6">
                          <div className="w-full h-full text-white">{card.icon}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="w-full text-center mb-6 md:mb-10">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Popular Services</h2>
                  <p className="text-gray-500 font-medium text-sm md:text-base">Top selling packages across our platform</p>
                </div>
                <div className="w-full max-w-4xl mx-auto space-y-3 md:space-y-4 mb-10">
                   <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { if(!user) setShowAuth(true); else setCurrentView('order_instagram'); }}>
                      <div className="flex items-center gap-3 w-full md:w-auto mb-3 md:mb-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.88z"/></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm md:text-base">Instagram Premium Followers</h4>
                          <div className="flex items-center gap-1 text-[10px] md:text-xs text-orange-400 mt-0.5">★★★★★ <span className="text-gray-400 ml-1">(4.9/5)</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t border-gray-100 md:border-none pt-3 md:pt-0">
                        <div className="text-left md:text-right flex items-center gap-2 md:block">
                          <span className="text-[10px] md:text-xs text-gray-400 line-through">₹120</span>
                          <span className="font-extrabold text-blue-600 text-base md:text-lg">₹80 <span className="text-[10px] md:text-xs text-gray-500 font-normal">/ 1k</span></span>
                        </div>
                        <button className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-4 py-1.5 md:py-2 rounded-lg hover:bg-gray-200">Order</button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'order_instagram' && user && (
             <div className="w-full max-w-6xl px-4 flex flex-col items-center animate-in slide-in-from-right-4 duration-300 mt-4 md:mt-8">
               <div className="w-full max-w-md flex justify-start mb-4"><button onClick={() => setCurrentView('hub')} className="text-gray-500 hover:text-gray-900 transition-colors text-sm font-bold flex items-center gap-2">← Back</button></div>
               <OrderForm user={user} />
             </div>
          )}

          {currentView === 'history' && user && (
            <div className="mt-4 md:mt-8 w-full max-w-6xl px-4"><Dashboard user={user} /></div>
          )}
        </div>
      )}

      {/* MOBILE APP-STYLE BOTTOM NAV */}
      {user && (
        <div className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50 px-8 py-3 flex justify-between items-center pb-safe">
          <button onClick={() => setCurrentView('hub')} className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'hub' || currentView === 'order_instagram' ? 'text-blue-600' : 'text-gray-400'}`}>
            {svgs.home}
            <span className="text-[10px] font-bold">Home</span>
          </button>
          
          <button onClick={() => setCurrentView('hub')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-xl shadow-lg transform -translate-y-5 shadow-blue-500/30 active:scale-95 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </button>

          <button onClick={() => setCurrentView('history')} className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'history' ? 'text-blue-600' : 'text-gray-400'}`}>
            {svgs.history}
            <span className="text-[10px] font-bold">History</span>
          </button>
        </div>
      )}
      
    </div>
  );
}

export default App;
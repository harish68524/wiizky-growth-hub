import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const Login = ({ onGoogleLogin, onGuestLogin, onManualLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let userCredential;
      if (isSignUp) {
        // Create a brand new account
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Log into an existing account
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Send the successful login data back to App.jsx to save in MongoDB
      onManualLogin(userCredential.user);

    } catch (error) {
      // Clean up the ugly Firebase error messages for the user
      const cleanError = error.message.replace('Firebase: ', '').replace(/\(auth.*\)\./, '');
      alert(`Error: ${cleanError}`);
    }
  };

  // ... (keep your existing return statement exactly the same below this line)

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(176,38,255,0.3)] animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-neon-gradient mb-2 tracking-tight">
          Wiizky
        </h1>
        <p className="text-gray-400 font-medium">
          {isSignUp ? 'Create your account' : 'Welcome back to the hub'}
        </p>
      </div>

      {/* Manual Auth Form */}
      <form onSubmit={handleManualSubmit} className="space-y-4 mb-6">
        <div>
          <input 
            type="email" 
            required
            placeholder="Email Address"
            className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-4 focus:outline-none focus:border-neon-purple transition-colors placeholder-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input 
            type="password" 
            required
            placeholder="Password"
            className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-4 focus:outline-none focus:border-neon-purple transition-colors placeholder-gray-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button 
          type="submit"
          className="w-full py-4 rounded-xl font-bold text-white bg-neon-gradient hover:shadow-[0_0_20px_rgba(176,38,255,0.5)] transition-all duration-300"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-white/10 flex-1"></div>
        <span className="text-gray-500 text-sm font-medium">OR</span>
        <div className="h-px bg-white/10 flex-1"></div>
      </div>

      {/* Alternative Logins */}
      <div className="space-y-3">
        <button 
          onClick={onGoogleLogin}
          className="w-full py-3.5 px-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 rounded-xl text-black font-bold transition-all duration-300"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <button 
          onClick={onGuestLogin}
          className="w-full py-3.5 px-4 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-semibold transition-all duration-300"
        >
          Enter as Guest (Demo Mode)
        </button>
      </div>

      {/* Toggle Sign Up / Sign In */}
      <p className="text-center text-gray-400 text-sm mt-8">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-neon-blue hover:text-white font-bold transition-colors"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>

    </div>
  );
};

export default Login;
// src/components/AuthModal.tsx
import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FiX, FiMail, FiLock, FiLogIn, FiUserPlus, FiSend, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthView = 'signIn' | 'signUp' | 'emailLink';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    signInWithEmailPassword, 
    signUpWithEmailPassword, 
    sendSignInLinkToEmail, 
    signInWithGoogle, 
    loading, 
    error,
    clearError
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<AuthView>('signIn');

  const handleClose = () => {
    clearError();
    setEmail('');
    setPassword('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    let success = false;
    if (view === 'signIn') {
      success = !!await signInWithEmailPassword(email, password);
    } else if (view === 'signUp') {
      success = !!await signUpWithEmailPassword(email, password);
    } else if (view === 'emailLink') {
      await sendSignInLinkToEmail(email);
      // Success here is indicated by an alert in AuthContext, modal can stay open or close
      // For now, let's keep it open, user might want to try another method if email is slow
      return; // Don't close modal immediately for email link
    }
    if (success) {
      handleClose();
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    const success = await signInWithGoogle();
    if (success) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        className="bg-[var(--main-bg)] p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-[var(--border-color)] relative"
        onClick={(e) => e.stopPropagation()} // Prevent click inside from closing
      >
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Close authentication modal"
        >
          <FiX size={24} />
        </button>

        <h2 id="auth-modal-title" className="text-2xl sm:text-3xl font-[var(--font-display)] text-[var(--primary-glow)] text-center mb-6">
          {view === 'signIn' && 'Welcome Back'}
          {view === 'signUp' && 'Create Account'}
          {view === 'emailLink' && 'Passwordless Sign-In'}
        </h2>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-3 rounded-md text-sm mb-4 flex items-center">
            <FiAlertCircle className="mr-2 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {view !== 'emailLink' && (
            <>
              <div>
                <label htmlFor="email" className="block text-xs text-[var(--text-secondary)] mb-1">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input 
                    type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full bg-[var(--sidebar-bg)] border border-[var(--border-color)] rounded-md p-2.5 pl-10 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary-glow)] focus:outline-none placeholder:text-[var(--text-secondary)]/50"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-xs text-[var(--text-secondary)] mb-1">Password</label>
                 <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input 
                        type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} 
                        required
                        minLength={6}
                        className="w-full bg-[var(--sidebar-bg)] border border-[var(--border-color)] rounded-md p-2.5 pl-10 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary-glow)] focus:outline-none placeholder:text-[var(--text-secondary)]/50"
                        placeholder="••••••••"
                    />
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--primary-glow)] text-black font-semibold py-3 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <FiLoader className="animate-spin mr-2" /> : (view === 'signIn' ? <FiLogIn className="mr-2"/> : <FiUserPlus className="mr-2"/>)}
                {loading ? 'Processing...' : (view === 'signIn' ? 'Sign In' : 'Sign Up')}
              </button>
            </>
          )}

          {view === 'emailLink' && (
            <>
              <div>
                <label htmlFor="emailLinkEmail" className="block text-xs text-[var(--text-secondary)] mb-1">Email</label>
                 <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input 
                        type="email" id="emailLinkEmail" value={email} onChange={(e) => setEmail(e.target.value)} 
                        required 
                        className="w-full bg-[var(--sidebar-bg)] border border-[var(--border-color)] rounded-md p-2.5 pl-10 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary-glow)] focus:outline-none placeholder:text-[var(--text-secondary)]/50"
                        placeholder="you@example.com"
                    />
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white font-semibold py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                 {loading ? <FiLoader className="animate-spin mr-2" /> : <FiSend className="mr-2"/>}
                 {loading ? 'Sending...' : 'Send Sign-In Link'}
              </button>
            </>
          )}
        </form>

        <div className="my-6 flex items-center">
          <span className="flex-grow border-t border-[var(--border-color)]"></span>
          <span className="mx-4 text-xs text-[var(--text-secondary)]">OR</span>
          <span className="flex-grow border-t border-[var(--border-color)]"></span>
        </div>

        <button 
            onClick={handleGoogleSignIn} 
            disabled={loading}
            className="w-full bg-white text-gray-700 font-medium py-2.5 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50"
        >
            <FcGoogle size={20} className="mr-3" />
            Sign in with Google
        </button>

        <div className="mt-6 text-center text-xs">
          {view === 'signIn' ? (
            <p className="text-[var(--text-secondary)]">
              No account? <button onClick={() => { setView('signUp'); clearError(); }} className="text-[var(--primary-glow)] hover:underline">Sign Up</button> | <button onClick={() => { setView('emailLink'); clearError(); }} className="text-blue-400 hover:underline">Passwordless</button>
            </p>
          ) : view === 'signUp' ? (
            <p className="text-[var(--text-secondary)]">
              Already have an account? <button onClick={() => { setView('signIn'); clearError(); }} className="text-[var(--primary-glow)] hover:underline">Sign In</button> | <button onClick={() => { setView('emailLink'); clearError(); }} className="text-blue-400 hover:underline">Passwordless</button>
            </p>
          ) : view === 'emailLink' ? (
            <p className="text-[var(--text-secondary)]">
              Prefer password? <button onClick={() => { setView('signIn'); clearError(); }} className="text-[var(--primary-glow)] hover:underline">Sign In</button> | <button onClick={() => { setView('signUp'); clearError(); }} className="text-[var(--primary-glow)] hover:underline">Sign Up</button>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail as firebaseSendSignInLinkToEmail,
  isSignInWithEmailLink as firebaseIsSignInWithEmailLink,
  signInWithEmailLink as firebaseSignInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  ActionCodeSettings,
} from 'firebase/auth';
import { auth } from '@/firebase'; // Assuming auth is exported from firebase.ts

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signUpWithEmailPassword: (email: string, pass: string) => Promise<User | null>;
  signInWithEmailPassword: (email: string, pass: string) => Promise<User | null>;
  sendSignInLinkToEmail: (email: string) => Promise<void>;
  isSignInWithEmailLink: (link: string) => boolean;
  completeSignInWithEmailLink: (email: string, link: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const EMAIL_FOR_SIGN_IN_LINK_KEY = 'streaksense_emailForSignInLink';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start true for initial auth state check
  const [error, setError] = useState<string | null>(null);

  const actionCodeSettings: ActionCodeSettings = {
    url: window.location.origin, // Redirect back to your app
    handleCodeInApp: true, // This must be true for email link sign-in
  };

  const clearError = () => setError(null);

  const signUpWithEmailPassword = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      return userCredential.user;
    } catch (e: any) {
      setError(e.message || "Failed to sign up.");
      console.error("Sign up error:", e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmailPassword = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return userCredential.user;
    } catch (e: any) {
      setError(e.message || "Failed to sign in.");
      console.error("Sign in error:", e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendSignInLinkToEmail = async (email: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_LINK_KEY, email); // Store email
      alert('Sign-in link sent to your email!');
    } catch (e: any) {
      setError(e.message || "Failed to send sign-in link.");
      console.error("Send sign-in link error:", e);
    } finally {
      setLoading(false);
    }
  };

  const isSignInWithEmailLink = (link: string): boolean => {
    return firebaseIsSignInWithEmailLink(auth, link);
  };

  const completeSignInWithEmailLink = async (email: string, link: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await firebaseSignInWithEmailLink(auth, email, link);
      window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_LINK_KEY);
      return userCredential.user;
    } catch (e: any) {
      setError(e.message || "Failed to sign in with email link.");
      console.error("Sign in with email link error:", e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (e: any) {
      setError(e.message || "Failed to sign in with Google.");
      console.error("Google sign in error:", e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (e: any) {
      setError(e.message || "Failed to sign out.");
      console.error("Sign out error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    signUpWithEmailPassword,
    signInWithEmailPassword,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    completeSignInWithEmailLink,
    signInWithGoogle,
    signOutUser,
    clearError
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

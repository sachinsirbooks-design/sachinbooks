import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        try {
          // Identify admin status based exclusively on the required email
          const userEmailLower = user.email ? user.email.toLowerCase() : '';
          const isAdmin = userEmailLower === 'sachinsirbooks@gmail.com';

          const profileDoc = await getDoc(doc(db, 'users', user.uid));

          if (profileDoc.exists()) {
            const existingData = profileDoc.data() as UserProfile;
            // Sync isAdmin if it changed
            if (existingData.isAdmin !== isAdmin) {
              const updatedProfile = { ...existingData, isAdmin };
              try {
                await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
              } catch (e) {
                console.error('Failed to sync isAdmin to users collection:', e);
              }
              setProfile(updatedProfile);
            } else {
              setProfile(existingData);
            }
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              name: user.displayName || 'User',
              isAdmin,
              role: 'student',
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
            } catch (e) {
              console.error('Failed to create user profile:', e);
            }
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Profile fetch failed:', error);
          // Fallback minimal profile if getDoc(users/uid) fails
          setProfile({
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || 'User',
            isAdmin: (user.email ? user.email.toLowerCase() : '') === 'sachinsirbooks@gmail.com',
            role: 'student',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed in successfully!');
      setAuthModalOpen(false);
    } catch (error: any) {
      console.error('Firebase Auth Popup Error:', error);
      const isIframe = window.self !== window.top;
      
      if (isIframe || error.code === 'auth/popup-blocked' || error.slice?.(0, 15) === 'auth/popup-bloc' || error.message?.includes('popup')) {
        toast.error(
          "Standard Login popups are restricted inside development nested frames. Please click the 'Open in new tab' button at the top-right of the screen and sign in there!",
          { duration: 8000, id: 'auth-error-toast' }
        );
      } else {
        toast.error(`Login failed: ${error.message || String(error)}`);
      }
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully!');
      setAuthModalOpen(false);
    } catch (error: any) {
      console.error('Email sign in error:', error);
      let errMsg = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errMsg = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        errMsg = 'Invalid email address format.';
      }
      toast.error(errMsg);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Wait to set full display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        
        // Also save profile to firestore explicitly to guarantee student role is stored
        const studentProfile: UserProfile = {
          uid: userCredential.user.uid,
          email: email,
          name: name,
          isAdmin: email.toLowerCase() === 'sachinsirbooks@gmail.com',
          role: 'student',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), studentProfile);
        setProfile(studentProfile);
      }
      toast.success('Registered successfully!');
      setAuthModalOpen(false);
    } catch (error: any) {
      console.error('Email registration error:', error);
      let errMsg = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered.';
      } else if (error.code === 'auth/weak-password') {
        errMsg = 'Password must be at least 6 characters.';
      }
      toast.error(errMsg);
      throw error;
    }
  };

  const login = () => {
    setAuthModalOpen(true);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin: profile?.isAdmin || false, 
      login, 
      loginWithGoogle,
      loginWithEmail,
      signUpWithEmail,
      logout,
      isAuthModalOpen,
      setAuthModalOpen
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

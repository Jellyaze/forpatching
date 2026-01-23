import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authId) => {
    const { data, error } = await supabase
      .from('app_d56ee_profiles')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) {
      console.log('fetchProfile error:', error);
      return null;
    }

    return data || null;
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);

        const prof = await fetchProfile(session.user.id);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);

        const prof = await fetchProfile(session.user.id);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  const updateProfile = async (updates) => {
    try {
      if (!user?.id) {
        return { error: 'No authenticated user' };
      }

      const { data, error } = await supabase
        .from('app_d56ee_profiles')
        .update({
          ...updates,
        })
        .eq('auth_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.log('updateProfile error:', error);
        return { error };
      }

      setProfile(data);
      return { data, error: null };
    } catch (e) {
      console.log('updateProfile exception:', e);
      return { error: e };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const value = {
    user,
    profile,
    isAuthenticated,
    loading,
    updateProfile,
    signOut,
    setProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;

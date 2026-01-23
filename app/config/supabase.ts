import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yswdteyjxgaaucvlbxgx.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzd2R0ZXlqeGdhYXVjdmxieGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzU0NzYsImV4cCI6MjA4NDc1MTQ3Nn0.2jaZpRJgEEnbBOVt2NMHJp9wOCzM6jKu5TuFuCwAwxQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
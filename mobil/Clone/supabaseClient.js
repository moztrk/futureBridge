// lib/supabaseClient.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzrqiabxepsvznivtfgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cnFpYWJ4ZXBzdnpuaXZ0ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMzE4MjYsImV4cCI6MjA1NzgwNzgyNn0.xVZf-WaxNbYqieuqeURafXY3NtYUEAi0KSZuS8j48h0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // RN'de URL kontrolü yok
  },
});

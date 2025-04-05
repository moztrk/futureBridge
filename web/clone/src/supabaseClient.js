import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzrqiabxepsvznivtfgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cnFpYWJ4ZXBzdnpuaXZ0ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMzE4MjYsImV4cCI6MjA1NzgwNzgyNn0.xVZf-WaxNbYqieuqeURafXY3NtYUEAi0KSZuS8j48h0'; // .env dosyasındaki Anon Key'i al

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL veya Anon Key eksik!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
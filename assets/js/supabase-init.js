// ===========================================
// Supabase shared initialisation
// Used by both index.html (read) and admin.html (write)
// ===========================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// TODO: Replace with your actual Supabase project URL and anon key
const supabaseUrl = 'https://rwfmftnhobmdcbdeqgwc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Zm1mdG5ob2JtZGNiZGVxZ3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4ODY0MTEsImV4cCI6MjEwMDQ2MjQxMX0.7reM1dIH_TqoEWoqIkTzLVO8dRduDfMXHzKmGIUZh8s';
export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Database helpers ───────────────────────────────────────────
export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addEvent(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData]);
  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addNews(newsData) {
  const { data, error } = await supabase
    .from('news')
    .insert([newsData]);
  if (error) throw error;
  return data;
}

export async function deleteNews(id) {
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Auth helpers ─────────────────────────────────────────────────
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback) {
  // Fire immediately with current session state
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(session?.user || null);
  });
  
  // Listen for subsequent changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(session?.user || null);
    }
  );
  return subscription;
}

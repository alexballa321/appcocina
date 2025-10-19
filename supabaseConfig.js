// Sostituisci questi valori con le tue credenziali Supabase reali!
const SUPABASE_URL = 'https://xgftopjwpcdfjdxjkcpw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZnRvcGp3cGNkZmpkeGprY3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4Njg0OTksImV4cCI6MjA3NjQ0NDQ5OX0.1FjupklU47UP1Hbcn5dU3MoPNEMolPIYhDKGfN71szQ';

// Crea e assegna il client Supabase all'oggetto window per renderlo disponibile in app3.js
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

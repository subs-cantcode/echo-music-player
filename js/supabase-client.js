(function (global) {
  const url = String(global.ECHO_SUPABASE_URL || '').trim();
  const anonKey = String(global.ECHO_SUPABASE_ANON_KEY || '').trim();

  if (!global.supabase || typeof global.supabase.createClient !== 'function') {
    console.error('Supabase JS library failed to load.');
    global.echoSupabase = null;
    return;
  }

  if (!url || !anonKey) {
    console.error(
      'Missing Supabase config. Copy js/env.example.js to js/env.js, or set SUPABASE_URL and SUPABASE_ANON_KEY for the Vercel build.'
    );
    global.echoSupabase = null;
    return;
  }

  global.echoSupabase = global.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})(window);

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  res.status(200).send(
    `window.ECHO_SUPABASE_URL = ${JSON.stringify(url)};\n` +
      `window.ECHO_SUPABASE_ANON_KEY = ${JSON.stringify(anonKey)};\n`
  );
};

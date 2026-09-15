const fs = require('fs');
const path = require('path');

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const outPath = path.join(__dirname, '..', 'js', 'env.js');
const contents =
  `window.ECHO_SUPABASE_URL = ${JSON.stringify(url)};\n` +
  `window.ECHO_SUPABASE_ANON_KEY = ${JSON.stringify(anonKey)};\n`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, contents, 'utf8');

if (!url || !anonKey) {
  console.warn(
    'write-env.js: SUPABASE_URL and/or SUPABASE_ANON_KEY are empty. Auth and storage will not work until they are set.'
  );
} else {
  console.log('Wrote js/env.js from environment variables.');
}

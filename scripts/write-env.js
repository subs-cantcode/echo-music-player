import fs from 'fs'
import path from 'path'

function parseEnvFile(contents) {
  const vars = {}
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    vars[match[1]] = value
  }
  return vars
}

const envPath = path.join(process.cwd(), '.env')

// Preserve values already in a local .env so repeated local builds don't clobber them.
let existing = {}
try {
  existing = parseEnvFile(fs.readFileSync(envPath, 'utf8'))
} catch {}

const url =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  existing.VITE_SUPABASE_URL ||
  ''
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  existing.VITE_SUPABASE_ANON_KEY ||
  ''

const contents =
  `VITE_SUPABASE_URL=${JSON.stringify(url)}\n` +
  `VITE_SUPABASE_ANON_KEY=${JSON.stringify(anonKey)}\n`

fs.writeFileSync(envPath, contents, 'utf8')

if (!url || !anonKey) {
  console.warn(
    'write-env.js: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are empty. Auth and storage will not work until they are set.'
  )
} else {
  console.log('Wrote .env from environment variables.')
}

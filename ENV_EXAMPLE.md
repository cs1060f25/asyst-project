Environment variables for Supabase auth

Add these to your local `.env` (not committed):

- NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
- NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

Notes:
- These are public keys intended for the browser. Never commit secrets.
- After setting, restart `npm run dev`.

import pg from 'pg'
import 'dotenv/config'

// The pool reads DATABASE_URL from .env — copy .env.example to .env to get started.
// Never hardcode credentials; use environment variables instead.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

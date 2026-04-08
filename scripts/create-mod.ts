#!/usr/bin/env bun
/**
 * Bootstrap a moderator account.
 * Usage: bun scripts/create-mod.ts <email> <name> <password>
 */

import { Database } from 'bun:sqlite'
import bcrypt from 'bcryptjs'
import { resolve } from 'node:path'

const [email, name, password] = process.argv.slice(2)

if (!email || !name || !password) {
  console.error('Usage: bun scripts/create-mod.ts <email> <name> <password>')
  process.exit(1)
}

const dbPath = resolve(import.meta.dir, '../.data/db/sqlite.db')
const db = new Database(dbPath)

const passwordHash = await bcrypt.hash(password, 10)
const id = crypto.randomUUID()
const now = new Date().toISOString()

db.run(
  `INSERT INTO moderators (id, email, password_hash, name, created_at)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name`,
  [id, email, passwordHash, name, now],
)

db.close()
console.log(`Moderator "${name}" <${email}> created.`)

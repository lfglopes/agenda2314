import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  start_at: text('start_at').notNull(),
  end_at: text('end_at').notNull(),
  location: text('location'),
  image_key: text('image_key'),
  submitter_email: text('submitter_email').notNull(),
  submitter_name: text('submitter_name'),
  status: text('status', {
    enum: ['unconfirmed', 'pending', 'approved', 'rejected'],
  }).notNull().default('unconfirmed'),
  confirmation_token: text('confirmation_token'),
  token_expires_at: text('token_expires_at'),
  moderator_notes: text('moderator_notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
})

export const moderators = sqliteTable('moderators', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  created_at: text('created_at').notNull(),
})

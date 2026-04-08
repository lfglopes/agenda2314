import type { events } from '../db/schema'

// Event type for use in server and (as type-only import) in client components
export type Event = typeof events.$inferSelect

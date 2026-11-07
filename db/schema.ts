import { pgTable, date, text, integer, primaryKey, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const usageCounts = pgTable('usage_counts', {
  day: date('day').notNull(),
  event: text('event').notNull(),
  symptom: text('symptom').notNull(),
  count: integer('count').notNull().default(1),
}, (table) => [
  primaryKey({ columns: [table.day, table.event, table.symptom] }),
  check('usage_count_positive', sql`${table.count} > 0`),
]);

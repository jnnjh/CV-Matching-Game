// This migration creates the initial schema and seeds demo data.
// Run it with: npm run migrate
//
// To add a new table or column, create a new migration file:
//   npm run migrate:create -- my-new-feature
//
// Alternatives to node-pg-migrate:
//   - Prisma (ORM + migrations):  https://www.prisma.io
//   - Drizzle (lightweight ORM):  https://orm.drizzle.team

/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
export const shorthands = undefined

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'text', notNull: true },
    role: { type: 'text', notNull: true },
  })

  // Seed demo data — remove or replace for your own project
  pgm.sql(`
    INSERT INTO users (name, role) VALUES
      ('Alice García', 'Frontend Developer'),
      ('Bob Mwangi', 'Backend Developer'),
      ('Carmen Liu', 'Fullstack Developer')
  `)
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const down = (pgm) => {
  pgm.dropTable('users')
}

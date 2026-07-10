export const shorthands = undefined

export const up = (pgm) => {
  // GAMES
  pgm.createTable('games', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    game_code: {
      type: 'varchar(10)',
      notNull: true,
      unique: true,
    },
    password: {
      type: 'text',
      notNull: true,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'waiting',
    },
    current_round: {
      type: 'integer',
      notNull: true,
      default: 1,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
  })

  // USERS
  pgm.createTable('users', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    game_id: {
      type: 'integer',
      notNull: true,
      references: 'games(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
    },
    photo_url: {
      type: 'text',
    },
    is_host: {
      type: 'boolean',
      default: false,
    },
    joined_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  })

  // STATEMENTS
  pgm.createTable('statements', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    game_id: {
      type: 'integer',
      notNull: true,
      references: 'games(id)',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
      unique: true,
    },
    content: {
      type: 'text',
      notNull: true,
    },
    round_order: {
      type: 'integer',
      notNull: true,
    },
  })

  // VOTES
  pgm.createTable('votes', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    game_id: {
      type: 'integer',
      notNull: true,
      references: 'games(id)',
      onDelete: 'CASCADE',
    },
    statement_id: {
      type: 'integer',
      notNull: true,
      references: 'statements(id)',
      onDelete: 'CASCADE',
    },
    voter_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    guessed_user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  })

  pgm.addConstraint('votes', 'unique_vote_per_round', {
    unique: ['statement_id', 'voter_id'],
  })
}

export const down = (pgm) => {
  pgm.dropTable('votes')
  pgm.dropTable('statements')
  pgm.dropTable('users')
  pgm.dropTable('games')
}
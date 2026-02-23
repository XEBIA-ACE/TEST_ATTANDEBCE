require('dotenv').config();
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('./connection');
const logger = require('../config/logger.config');

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, 'migrations', '*.js'),
    resolve: ({ name, path: migrationPath, context }) => {
      const migration = require(migrationPath);
      return {
        name,
        up: async () => migration.up({ context }),
        down: async () => migration.down({ context }),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: {
    info: (msg) => logger.info(msg),
    warn: (msg) => logger.warn(msg),
    error: (msg) => logger.error(msg),
    debug: (msg) => logger.debug(msg),
  },
});

async function runMigrations() {
  const action = process.argv[2];
  try {
    if (action === 'undo') {
      logger.info('Reverting last migration...');
      await umzug.down();
    } else {
      logger.info('Running pending migrations...');
      await umzug.up();
    }
    logger.info('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Export umzug for programmatic use in tests
module.exports = { umzug };

if (require.main === module) {
  runMigrations();
}

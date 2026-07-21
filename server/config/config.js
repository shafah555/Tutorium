require('dotenv').config();

const useSSL = process.env.DB_SSL === 'true';

const common = {
  dialect: 'postgres',
  dialectOptions: useSSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  logging: false,
};

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    ...common,
  },
  test: {
    use_env_variable: 'DATABASE_URL',
    ...common,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    ...common,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
};

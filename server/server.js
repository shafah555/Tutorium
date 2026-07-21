require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // In production, prefer running migrations explicitly (npm run migrate).
    // sync() here is a convenience fallback for first boot / simple deployments.
    await sequelize.sync();
    console.log('Database models synced.');

    app.listen(PORT, () => {
      console.log(`Tutorium API server running on port ${PORT}`);
      console.log(`Swagger docs available at /api-docs`);
    });
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
}

start();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { config } from './config/env.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.PORT, () => {
      console.log(`=======================================================`);
      console.log(` ResearchLens AI API Server running on port ${config.PORT}`);
      console.log(` Environment: ${config.NODE_ENV}`);
      console.log(` Health check: http://localhost:${config.PORT}/api/health`);
      console.log(`=======================================================`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down ResearchLens AI cleanly...`);
      server.close(async () => {
        await disconnectDB();
        console.log('Server and database connections successfully closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('Fatal initialization error:', error.message);
    process.exit(1);
  }
};

startServer();


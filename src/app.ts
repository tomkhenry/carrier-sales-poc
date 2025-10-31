import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { appConfig } from './config/app.config';
import { logger } from './utils/logger';
import { requestLogger } from './api/middleware/requestLogger';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler';

// Import routes
import carrierRoutes from './api/routes/carrier.routes';
import loadRoutes from './api/routes/load.routes';
import metricsRoutes from './api/routes/metrics.routes';

// Load environment variables
dotenv.config();

/**
 * Express Application Setup
 */
class App {
  public app: Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = appConfig.port;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize Express middlewares
   */
  private initializeMiddlewares(): void {
    // CORS
    this.app.use(cors());

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(requestLogger);
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Inbound Carrier Sales Automation API is running',
        timestamp: new Date().toISOString(),
        environment: appConfig.nodeEnv
      });
    });

    // API routes (must be before static files)
    this.app.use('/api/metrics', metricsRoutes);
    this.app.use('/api/carrier', carrierRoutes);
    this.app.use('/api/load', loadRoutes);

    // Serve dashboard static files
    const publicPath = path.join(__dirname, 'public');
    
    // Explicitly serve dashboard routes
    this.app.get('/dashboard', (req: Request, res: Response) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
    
    this.app.get('/dashboard/', (req: Request, res: Response) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
    
    // Serve static assets
    this.app.use('/dashboard', express.static(publicPath));

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to Inbound Carrier Sales Automation API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          dashboard: '/dashboard',
          carrier: {
            verifyCarrier: 'POST /api/carrier/verify-carrier'
          },
          load: {
            assignLoad: 'POST /api/load/assign-load',
            available: 'GET /api/load/available',
            create: 'POST /api/load/create'
          },
          metrics: {
            overview: 'GET /api/metrics/overview',
            carrierValidation: 'GET /api/metrics/carrier-validation',
            loadMatching: 'GET /api/metrics/load-matching'
          }
        }
      });
    });
  }

  /**
   * Initialize error handling middlewares
   */
  private initializeErrorHandling(): void {
    // 404 handler (must be after all routes)
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  /**
   * Start the Express server
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info(`Server running on port ${this.port}`);
      logger.info(`Environment: ${appConfig.nodeEnv}`);
      logger.info(`Health check: http://localhost:${this.port}/health`);
      logger.info(`API docs: http://localhost:${this.port}/`);
    });
  }
}

// Create and start the application
const application = new App();
application.listen();

// Export for testing
export default application.app;


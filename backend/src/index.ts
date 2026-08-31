import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Catch unhandled promise rejections before they kill the Lambda
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

// Load Environment variables
dotenv.config();

// Initialize App
const app = express();
const PORT = process.env.PORT || 4000;

// Setup directories if missing (safely handle read-only serverless filesystems)
const assetsDir = path.join(__dirname, '../assets/templates');
if (!fs.existsSync(assetsDir)) {
  try {
    fs.mkdirSync(assetsDir, { recursive: true });
  } catch (e) {
    // Ignore read-only filesystem errors in serverless
  }
}

// CORS Config
const corsOptions = {
  origin: true,
  credentials: true,
};
app.use(cors(corsOptions));

// Body Parser with 10MB limit for base64 uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static template uploads
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Import routers
import authRouter from './routes/auth';
import departmentsRouter from './routes/departments';
import eventsRouter from './routes/events';
import participantsRouter from './routes/participants';
import tasksRouter from './routes/tasks';
import certificatesRouter from './routes/certificates';
import exportsRouter from './routes/exports';

// Register routes
app.use('/api/auth', authRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/exports', exportsRouter);

// Health Check
app.get('/api/health', (req: express.Request, res: express.Response) => {
  return res.json({ status: 'ok', serverless: !!process.env.VERCEL, timestamp: new Date() });
});

// Debug endpoint — returns the actual error for troubleshooting
app.get('/api/debug', async (req: express.Request, res: express.Response) => {
  const info: any = {
    node: process.version,
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    database_url_set: !!process.env.DATABASE_URL,
    timestamp: new Date(),
  };
  try {
    const { prisma } = await import('./utils/db');
    await (prisma as any).$queryRaw`SELECT 1`;
    info.db = 'connected';
  } catch (err: any) {
    info.db = 'failed';
    info.db_error = err?.message || String(err);
  }
  return res.json(info);
});

// Start Server locally if not running on Vercel Serverless
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Tamil Nadu Volunteer Backend running on port ${PORT}`);
  });
}

export default app;

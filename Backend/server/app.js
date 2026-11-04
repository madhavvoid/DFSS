import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import nodeRoutes from './routes/nodeRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../Frontend/dist');

app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean) }));
app.use(express.json({ limit: '32kb' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/nodes', nodeRoutes);
app.use(express.static(frontendDirectory));
app.get(/.*/, (req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(frontendDirectory, 'index.html'), (error) => {
    if (error) next(error);
  });
});
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
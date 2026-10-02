import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import nodeRoutes from './routes/nodeRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean) }));
app.use(express.json({ limit: '32kb' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/nodes', nodeRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
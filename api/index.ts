import express from 'express';
import authRoutes from '../server/routes/authRoutes';
import walletRoutes from '../server/routes/walletRoutes';
import kycRoutes from '../server/routes/kycRoutes';
import adminRoutes from '../server/routes/adminRoutes';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Vercel mounts this function at /api and strips that prefix before Express
// receives the request. Normalize direct invocations as well so both forms work.
app.use((req, _res, next) => {
  if (req.url === '/api' || req.url.startsWith('/api/')) {
    req.url = req.url.slice(4) || '/';
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'USDT Vault Enterprise Custody Engine',
    version: '1.0.0-prod',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/kyc', kycRoutes);
app.use('/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found.' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api] request failed', err);
  if (!res.headersSent) {
    res.status(500).json({ success: false, error: 'Unable to complete the request. Please try again.' });
  }
});

export default app;

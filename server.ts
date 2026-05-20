// Set ONNX Runtime and Transformers.js logging levels before ANY imports
process.env.ORT_LOGGING_LEVEL = '4';
process.env.transformers_js_log_level = 'error';
process.env.TRANSFORMERS_JS_LOG_LEVEL = 'error';

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables early
dotenv.config();

import v3Router from './routes/v3.ts';
// import { p2p } from './services/p2pService';
import { db } from './db';

const isProd = process.env.NODE_ENV === 'production';

function parseCorsOrigins(): string | string[] | boolean {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    // Default CORS origins for hybrid architecture
    if (isProd) {
      return ['https://amazebid.co', 'https://www.amazebid.co'];
    }
    return true; // Allow all in development
  }
  if (raw === '*') return true;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length === 1 ? list[0]! : list;
}

function redactHeadersForLog(headers: Record<string, unknown>) {
  const sensitive = new Set(['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'set-cookie']);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = sensitive.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return out;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  console.log('[Server] Setting up Socket.io...');
  const corsOrigin = parseCorsOrigins();
  const io = new Server(server, {
    cors: typeof corsOrigin === 'boolean' ? { origin: corsOrigin } : { origin: corsOrigin }
  });
  app.set('io', io);
  const PORT = 3000;
  /** streamId → host socket.id (WebRTC signaling) */
  const streamHosts = new Map<string, string>();
  const chatRoomKey = (a: string, b: string) => (a < b ? `${a}::${b}` : `${b}::${a}`);

  // Middleware
  app.use(cors({ origin: corsOrigin === true ? true : corsOrigin }));
  app.use(express.json());

  if (!isProd) {
    app.use((req, _res, next) => {
      console.log(`[DEBUG] ${req.method} ${req.path}`);
      console.log('[DEBUG] Headers:', JSON.stringify(redactHeadersForLog(req.headers as Record<string, unknown>)));
      next();
    });
  }

  // API Health Check
  app.get('/api/health', (req, res) => {
    try {
      if (isProd) {
        res.json({
          status: 'ok',
          time: new Date().toISOString(),
          db_ready: !!db
        });
      } else {
        res.json({
          status: 'ok',
          time: new Date().toISOString(),
          gemini_key: !!process.env.GEMINI_API_KEY,
          api_key: !!process.env.API_KEY,
          db_ready: !!db
        });
      }
    } catch (err) {
      console.error('[Server] Health check failed:', err);
      res.status(500).json({ status: 'error', message: 'Internal Server Error during health check' });
    }
  });

  // API Routes
  app.use('/api', v3Router);

  // Real email (Resend) — must be registered before the /api 404 handler
  app.post('/api/send-email', async (req, res) => {
    const { to, subject, html } = req.body || {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu trường bắt buộc: to, subject, html'
      });
    }
    if (!emailRegex.test(String(to))) {
      return res.status(400).json({ success: false, error: 'Địa chỉ email không hợp lệ' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        error: 'RESEND_API_KEY is not configured on the server.',
        message: 'Vui lòng cấu hình RESEND_API_KEY trong phần Settings để gửi email thật.'
      });
    }

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: [to],
        subject: String(subject),
        html: String(html)
      });

      if (error) {
        console.error('Resend Error:', error);
        return res.status(400).json({ error });
      }

      res.json({ success: true, data });
    } catch (err) {
      console.error('Failed to send real email:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // API 404 handler
  app.use('/api', (req, res) => {
    console.log(`[Server] API 404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ status: 'error', message: `API route not found: ${req.originalUrl}` });
  });

  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server] Unhandled error:', err);
    if (res.headersSent) return next(err);
    if (req.path?.startsWith('/api') || req.originalUrl?.startsWith('/api')) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return res.status(500).json({ status: 'error', message });
    }
    next(err);
  });

  // Socket.io — rooms for live bids (client uses join:auction / join_product_room)
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const joinAuctionRoom = (productId: string) => {
      if (!productId || typeof productId !== 'string') return;
      socket.join(productId);
      console.log(`User ${socket.id} joined auction room ${productId}`);
    };

    socket.on('join_product_room', joinAuctionRoom);
    socket.on('join:auction', joinAuctionRoom);

    socket.on('leave:auction', (productId: string) => {
      if (!productId || typeof productId !== 'string') return;
      socket.leave(productId);
      console.log(`User ${socket.id} left auction room ${productId}`);
    });

    // --- Live stream WebRTC signaling (LiveStreamViewer) ---
    socket.on('stream:join', (payload: { streamId?: string; isHost?: boolean }) => {
      const streamId = payload?.streamId;
      if (!streamId || typeof streamId !== 'string') return;
      const room = `stream:${streamId}`;
      socket.join(room);
      if (payload?.isHost) {
        streamHosts.set(streamId, socket.id);
      } else {
        const hostSid = streamHosts.get(streamId);
        if (hostSid) {
          io.to(hostSid).emit('viewer:joined', socket.id);
        }
      }
    });

    socket.on('stream:offer', (payload: { offer?: unknown; to?: string }) => {
      if (payload?.to && payload?.offer) {
        io.to(payload.to).emit('stream:offer', { offer: payload.offer, from: socket.id });
      }
    });

    socket.on('stream:answer', (payload: { answer?: unknown; to?: string }) => {
      if (payload?.to && payload?.answer) {
        io.to(payload.to).emit('stream:answer', { answer: payload.answer, from: socket.id });
      }
    });

    socket.on('stream:ice-candidate', (payload: { candidate?: unknown; to?: string }) => {
      if (payload?.to && payload?.candidate !== undefined) {
        io.to(payload.to).emit('stream:ice-candidate', { candidate: payload.candidate, from: socket.id });
      }
    });

    // --- P2P chat relay (ChatWidget) ---
    socket.on('chat:join', (payload: { userId?: string; otherId?: string }) => {
      const { userId, otherId } = payload || {};
      if (!userId || !otherId) return;
      socket.join(`chat:${chatRoomKey(userId, otherId)}`);
    });

    socket.on('chat:message', (payload: { senderId?: string; receiverId?: string; text?: string }) => {
      const { senderId, receiverId, text } = payload || {};
      if (!senderId || !receiverId || !text) return;
      const room = `chat:${chatRoomKey(senderId, receiverId)}`;
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        senderId,
        text,
        timestamp: new Date().toISOString()
      };
      io.to(room).emit('chat:new_message', message);
    });

    socket.on('chat:typing', (payload: { senderId?: string; receiverId?: string; isTyping?: boolean }) => {
      const { senderId, receiverId, isTyping } = payload || {};
      if (!senderId || !receiverId) return;
      const room = `chat:${chatRoomKey(senderId, receiverId)}`;
      socket.to(room).emit('chat:typing_status', { senderId, isTyping: !!isTyping });
    });

    socket.on('disconnect', () => {
      for (const [streamId, hostId] of streamHosts.entries()) {
        if (hostId === socket.id) streamHosts.delete(streamId);
      }
      console.log('User disconnected');
    });
  });

  // Start listening BEFORE Vite to ensure API is ready even if Vite is slow
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] API and Base server listening on http://0.0.0.0:${PORT}`);
    
    // Vite middleware for development - Initialize in background to not block listening
    if (process.env.NODE_ENV !== "production") {
      console.log('[Server] Initializing Vite in background...');
      createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      }).then(vite => {
        app.use(vite.middlewares);
        console.log('[Server] Vite middleware mounted and ready');
      }).catch(e => {
        console.error(`[Server] Vite initialization failed: ${e.message}`);
      });
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  });

  // Background Auction Manager (Runs every 1 minute)
  setInterval(async () => {
      try {
        const products = db.get('products') || [];
        const now = new Date();
        let changed = false;

        const updatedProducts = products.map((p: any) => {
          if (p.type === 'AUCTION' && p.endTime && new Date(p.endTime) < now) {
            // Auction ended. Check bids.
            const bidCount = p.bidCount || 0;
            if (bidCount === 0 && p.autoRestart) {
              console.log(`[AuctionManager] Auto-restarting auction for ${p.title} (${p.id})`);
              changed = true;
              
              const oldStart = p.startTime ? new Date(p.startTime).getTime() : now.getTime();
              const oldEnd = new Date(p.endTime).getTime();
              const duration = oldEnd - oldStart;
              
              // Set new start to now and extend end by the same duration
              return {
                ...p,
                startTime: now.toISOString(),
                endTime: new Date(now.getTime() + duration).toISOString(),
                currentBid: p.price, // Reset to starting price
                bidHistory: [],
                status: 'AVAILABLE'
              };
            }
          }
          return p;
        });

        if (changed) {
          await db.update('products', () => updatedProducts);
          io.emit('auction:restarted', { message: 'Some auctions have been restarted' });
        }
      } catch (err) {
        console.error('[AuctionManager] Error:', err);
      }
    }, 60000); // 1 minute

    // Initialize P2P Relay Node after server starts
    /*
    try {
      console.log('[Server] Initializing P2P Relay Node...');
      p2p.initServer(server);
      console.log('[Server] P2P Relay Node initialized');
    } catch (err: any) {
      console.error('[Server] P2P Initialization failed:', err.message);
    }
    */
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

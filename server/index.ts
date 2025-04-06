import express, { type Request as ExpressRequest, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { buffer } from "micro";

// Extend Express Request type
interface Request extends ExpressRequest {
  rawBody?: Buffer;
}

const app = express();

// Create a raw body parser middleware for Stripe webhooks
const rawBodyParser = async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/webhooks/stripe' && req.headers['stripe-signature']) {
    try {
      console.log(`Stripe webhook received, parsing raw body...`);
      const rawBody = await buffer(req);
      req.rawBody = rawBody;
      console.log(`Raw body captured for Stripe webhook: ${rawBody.length} bytes`);
    } catch (error) {
      console.error(`Error capturing raw body for Stripe webhook:`, error);
    }
  }
  next();
};

// Apply raw body parser before json parser for webhook endpoint
app.use(rawBodyParser);
app.use(express.json({
  verify: (req: Request, res: Response, buf: Buffer) => {
    if (req.path === '/api/webhooks/stripe') {
      console.log(`Setting rawBody from JSON parser verify handler: ${buf.length} bytes`);
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port: 5000,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port 5000`);
  });
})();

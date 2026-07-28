import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { injectLandingPrerender } from "./landing-prerender";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    // NOTE: req.path is unreliable inside app.use("*") (mount-path stripping makes it "/"
    // for every request). Derive the pathname from originalUrl so query strings like
    // /?utm=... still match the homepage.
    const pathname = req.originalUrl.split('?')[0];

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      // Prerender landing content for bots/crawlers on the homepage only
      // (match on pathname so query strings like /?utm=... still get prerendered output)
      if (pathname === "/" || pathname === "/index.html") {
        template = injectLandingPrerender(template);
      }
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const servePrerenderedLanding = (_req: express.Request, res: express.Response) => {
    const template = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");
    res.status(200).set({ "Content-Type": "text/html" }).end(injectLandingPrerender(template));
  };

  // Intercept homepage requests BEFORE static serving so bots get prerendered content.
  // Registered for all methods the path can receive; matched on pathname so query
  // strings (/?utm=...) still get prerendered output.
  app.get("/", servePrerenderedLanding);
  app.get("/index.html", servePrerenderedLanding);

  // Disable static index serving so the handlers above are not shadowed
  app.use(express.static(distPath, { index: false }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

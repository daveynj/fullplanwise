import { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
import viteConfig from "../vite.config";
import { injectLandingPrerender } from "./landing-prerender";
import { injectBlogPrerender } from "./blog-prerender";
import { injectLessonPrerender } from "./lesson-prerender";

/**
 * Development-only: Vite dev server middleware. Loaded by index.ts through a
 * dynamic import so the production server never loads Vite or its plugins.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
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
      } else if (pathname.startsWith("/blog")) {
        // Prerender blog index/post content for bots (null = not a blog page or unpublished)
        const prerendered = await injectBlogPrerender(template, pathname, res.locals.blogPost);
        if (prerendered) template = prerendered;
        else if (/^\/blog\/[^/]+\/?$/.test(pathname)) {
          res.status(503).set({ "Content-Type": "text/html", "Retry-After": "120", "Cache-Control": "no-store" })
            .end('<html><head><meta name="robots" content="noindex"><title>Article temporarily unavailable</title></head><body>Please try this article again shortly.</body></html>');
          return;
        }
      } else if (pathname.startsWith("/lessons/") || pathname.startsWith("/esl-lessons")) {
        // Prerender public lesson pages and browse pages (null = private/missing/other)
        const prerendered = await injectLessonPrerender(template, pathname, res.locals.lesson);
        if (prerendered) template = prerendered;
        else if (pathname.startsWith("/lessons/")) {
          res.status(503).set({ "Content-Type": "text/html", "Retry-After": "120", "Cache-Control": "no-store" })
            .end('<html><head><meta name="robots" content="noindex"><title>Lesson temporarily unavailable</title></head><body>Please try this lesson again shortly.</body></html>');
          return;
        }
      }
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

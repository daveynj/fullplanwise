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
import { injectBlogPrerender } from "./blog-prerender";
import { injectLessonPrerender } from "./lesson-prerender";

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
        const prerendered = await injectBlogPrerender(template, pathname);
        if (prerendered) template = prerendered;
      } else if (pathname.startsWith("/lessons/") || pathname.startsWith("/esl-lessons")) {
        // Prerender public lesson pages and browse pages (null = private/missing/other)
        const prerendered = await injectLessonPrerender(template, pathname);
        if (prerendered) template = prerendered;
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

  // The built index.html never changes while the server runs, so read it once.
  let indexTemplate: string | undefined;
  const readIndexTemplate = () =>
    (indexTemplate ??= fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8"));

  const servePrerenderedLanding = (_req: express.Request, res: express.Response) => {
    const template = readIndexTemplate();
    res.status(200).set({ "Content-Type": "text/html" }).end(injectLandingPrerender(template));
  };

  // Intercept homepage requests BEFORE static serving so bots get prerendered content.
  // Registered for all methods the path can receive; matched on pathname so query
  // strings (/?utm=...) still get prerendered output.
  app.get("/", servePrerenderedLanding);
  app.get("/index.html", servePrerenderedLanding);

  // Intercept blog pages so bots get prerendered post content. Falls through to
  // the SPA shell when the slug is missing/unpublished (routes.ts already 404s those).
  const servePrerenderedBlog = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const template = readIndexTemplate();
      const pathname = req.originalUrl.split("?")[0];
      const prerendered = await injectBlogPrerender(template, pathname);
      if (prerendered) {
        res.status(200).set({ "Content-Type": "text/html" }).end(prerendered);
        return;
      }
      next();
    } catch (e) {
      next(e);
    }
  };
  app.get("/blog", servePrerenderedBlog);
  app.get("/blog/:slug", servePrerenderedBlog);

  // Public lesson pages and the crawlable browse pages get the same treatment.
  // Falls through to the SPA shell for private/missing lessons (routes.ts has
  // already returned a 404 for those before this handler runs).
  const servePrerenderedLesson = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const template = readIndexTemplate();
      const pathname = req.originalUrl.split("?")[0];
      const prerendered = await injectLessonPrerender(template, pathname);
      if (prerendered) {
        res.status(200).set({ "Content-Type": "text/html" }).end(prerendered);
        return;
      }
      next();
    } catch (e) {
      next(e);
    }
  };
  app.get("/lessons/:id", servePrerenderedLesson);
  app.get("/esl-lessons", servePrerenderedLesson);
  app.get("/esl-lessons/:level", servePrerenderedLesson);

  // Disable static index serving so the handlers above are not shadowed
  // Files in /assets have content hashes in their names, so browsers can cache
  // them for a year; anything else (index.html, images) keeps default caching.
  app.use(
    express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.split(path.sep).includes("assets")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

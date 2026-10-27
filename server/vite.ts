import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { injectLandingPrerender } from "./landing-prerender";
import { injectBlogPrerender } from "./blog-prerender";
import { injectLessonPrerender } from "./lesson-prerender";

// Development-only Vite middleware lives in ./vite-dev, which index.ts loads
// with a dynamic import so production never loads Vite or its plugins.

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
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
      const prerendered = await injectBlogPrerender(template, pathname, res.locals.blogPost);
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
      const prerendered = await injectLessonPrerender(template, pathname, res.locals.lesson);
      if (prerendered) {
        res.status(200).set({ "Content-Type": "text/html" }).end(prerendered);
        return;
      }
      if (pathname.startsWith("/lessons/")) {
        // Never let a transient prerender failure cache the homepage's og:url
        // as the destination for a real lesson link.
        res.status(503).set({ "Content-Type": "text/html", "Retry-After": "120", "Cache-Control": "no-store" })
          .end('<html><head><meta name="robots" content="noindex"><title>Lesson temporarily unavailable</title></head><body>Please try this lesson again shortly.</body></html>');
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

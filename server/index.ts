import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";
import { projects } from "@db/schema";

const app = express();
app.use(express.json());
app.use(express.text()); // Add support for text/plain for CSV import
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
  try {
    log("Starting server...");
    log("Testing database connection...");

    // Test database connection and create tables if they don't exist
    try {
      await db.query.projects.findFirst();
      log("Database connection successful");
    } catch (error) {
      log("Error connecting to database:", (error as Error).message);
      throw error;
    }

    log("Initializing routes...");
    const server = registerRoutes(app);

    // Enhanced error handling for production
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : (err as Error).message || 'Internal Server Error';

      log(`Error handling request: ${(err as Error).message}`);
      res.status(status).json({ message });
      console.error(err); // Log the full error in production
    });

    // Setup static file serving based on environment
    if (app.get("env") === "development") {
      log("Setting up development server...");
      await setupVite(app, server);
    } else {
      log("Setting up production server...");
      serveStatic(app);
    }

    // Use port from environment or fallback to 5000
    const PORT = parseInt(process.env.PORT || "5000", 10);
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running in ${app.get('env')} mode on port ${PORT}`);
    });
  } catch (error) {
    log("Critical error starting server:", (error as Error).message);
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
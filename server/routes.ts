import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { projects, tasks } from "@db/schema";
import { eq } from "drizzle-orm";

function logError(context: string, error: unknown) {
  console.error(`[${context}] Error:`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
}

export function registerRoutes(app: Express): Server {
  // Projects endpoints
  app.get("/api/projects", async (_req, res) => {
    try {
      const allProjects = await db.query.projects.findMany({
        orderBy: (projects, { desc }) => [desc(projects.createdAt)]
      });
      res.json(allProjects);
    } catch (error) {
      logError("GET /api/projects", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const project = await db.insert(projects).values(req.body).returning();
      res.json(project[0]);
    } catch (error) {
      logError("POST /api/projects", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!id || !name) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const updated = await db
        .update(projects)
        .set({ name })
        .where(eq(projects.id, parseInt(id)))
        .returning();

      if (!updated.length) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(updated[0]);
    } catch (error) {
      logError("PATCH /api/projects/:id", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const projectId = parseInt(id);

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // First delete all tasks associated with this project
      await db.delete(tasks).where(eq(tasks.projectId, projectId));

      // Then delete the project
      const deleted = await db.delete(projects).where(eq(projects.id, projectId)).returning();

      if (!deleted.length) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(204).send();
    } catch (error) {
      logError("DELETE /api/projects/:id", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Tasks endpoints
  app.get("/api/tasks", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Missing date range parameters" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const allTasks = await db.query.tasks.findMany({
        with: {
          project: true
        },
        where: (tasks, { and, gte, lte }) => 
          and(gte(tasks.date, start), lte(tasks.date, end)),
        orderBy: (tasks, { desc }) => [desc(tasks.date)]
      });

      res.json(allTasks);
    } catch (error) {
      logError("GET /api/tasks", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const { projectId, date } = req.body;

      if (!projectId || !date) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const taskDate = new Date(date);
      if (isNaN(taskDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const task = await db.insert(tasks)
        .values({
          projectId: parseInt(projectId),
          date: taskDate,
        })
        .returning();

      res.json(task[0]);
    } catch (error) {
      logError("POST /api/tasks", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const taskId = parseInt(id);

      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const deleted = await db.delete(tasks)
        .where(eq(tasks.id, taskId))
        .returning();

      if (!deleted.length) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(204).send();
    } catch (error) {
      logError("DELETE /api/tasks/:id", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
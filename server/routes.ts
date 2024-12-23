import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { projects, tasks } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Projects endpoints
  app.get("/api/projects", async (_req, res) => {
    try {
      const allProjects = await db.query.projects.findMany({
        orderBy: (projects, { desc }) => [desc(projects.createdAt)]
      });
      res.json(allProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const project = await db.insert(projects).values(req.body).returning();
      res.json(project[0]);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const projectId = parseInt(id);

      // First delete all tasks associated with this project
      await db.delete(tasks).where(eq(tasks.projectId, projectId));

      // Then delete the project
      await db.delete(projects).where(eq(projects.id, projectId));

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Tasks endpoints
  app.get("/api/tasks", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let query = db.query.tasks.findMany({
        with: {
          project: true
        },
        orderBy: (tasks, { desc }) => [desc(tasks.date)]
      });

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        query = db.query.tasks.findMany({
          with: {
            project: true
          },
          where: (tasks, { and, gte, lte }) => 
            and(gte(tasks.date, start), lte(tasks.date, end)),
          orderBy: (tasks, { desc }) => [desc(tasks.date)]
        });
      }

      const allTasks = await query;
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = {
        projectId: req.body.projectId,
        date: new Date(req.body.date),
      };
      const task = await db.insert(tasks).values(taskData).returning();
      res.json(task[0]);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(tasks).where(eq(tasks.id, parseInt(id)));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { projects, tasks } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Projects endpoints
  app.get("/api/projects", async (_req, res) => {
    const allProjects = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)]
    });
    res.json(allProjects);
  });

  app.post("/api/projects", async (req, res) => {
    const project = await db.insert(projects).values(req.body).returning();
    res.json(project[0]);
  });

  // Tasks endpoints
  app.get("/api/tasks", async (req, res) => {
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
  });

  app.post("/api/tasks", async (req, res) => {
    const taskData = {
      ...req.body,
      date: new Date(req.body.date)
    };
    const task = await db.insert(tasks).values(taskData).returning();
    res.json(task[0]);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    await db.delete(tasks).where(eq(tasks.id, parseInt(id)));
    res.status(204).send();
  });

  const httpServer = createServer(app);
  return httpServer;
}
import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { projects, tasks } from "@db/schema";
import { eq } from "drizzle-orm";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";

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

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const updated = await db
        .update(projects)
        .set({ name })
        .where(eq(projects.id, parseInt(id)))
        .returning();

      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
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

  // New CSV export endpoint
  app.get("/api/export/csv", async (_req, res) => {
    try {
      const allTasks = await db.query.tasks.findMany({
        with: {
          project: true
        },
        orderBy: (tasks, { desc }) => [desc(tasks.date)]
      });

      const csvData = allTasks.map(task => ({
        date: new Date(task.date).toISOString().split('T')[0],
        project_name: task.project?.name || '',
        project_color: task.project?.color || ''
      }));

      stringify(csvData, {
        header: true,
        columns: ['date', 'project_name', 'project_color']
      }, (err, output) => {
        if (err) throw err;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
        res.send(output);
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // New CSV import endpoint
  app.post("/api/import/csv", async (req, res) => {
    try {
      const records: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true
      });

      parser.on('readable', async function() {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      parser.on('end', async function() {
        for (const record of records) {
          // First ensure the project exists
          let project = await db.query.projects.findFirst({
            where: eq(projects.name, record.project_name)
          });

          if (!project) {
            const [newProject] = await db.insert(projects).values({
              name: record.project_name,
              color: record.project_color || '#6366f1'
            }).returning();
            project = newProject;
          }

          // Then create the task
          await db.insert(tasks).values({
            date: new Date(record.date),
            projectId: project.id
          });
        }
        res.json({ message: `Imported ${records.length} records successfully` });
      });

      parser.write(req.body);
      parser.end();
    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ message: "Failed to import CSV" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
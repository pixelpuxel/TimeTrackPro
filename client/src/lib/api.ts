import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import type { InsertProject, InsertTask, Project, Task } from "@db/schema";

export function useTasks(startDate?: Date, endDate?: Date) {
  return useQuery<Task[]>({
    queryKey: ["/api/tasks", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.status}`);
      }
      return res.json();
    }
  });
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        throw new Error(`Failed to fetch projects: ${res.status}`);
      }
      return res.json();
    }
  });
}

export function useCreateTask() {
  return useMutation({
    mutationFn: async (task: InsertTask) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });
}

export function useCreateProject() {
  return useMutation({
    mutationFn: async (project: InsertProject) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project)
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    }
  });
}

export function useUpdateProject() {
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    }
  });
}

export function useDeleteProject() {
  return useMutation({
    mutationFn: async (projectId: number) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });
}

// New CSV export function
export function exportToCSV() {
  window.open("/api/export/csv", "_blank");
}

// New CSV import mutation
export function useImportCSV() {
  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text
      });
      if (!res.ok) throw new Error("Failed to import CSV");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    }
  });
}
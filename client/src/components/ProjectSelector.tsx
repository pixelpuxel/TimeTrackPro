import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useProjects, useCreateProject } from "@/lib/api";
import type { Project } from "@db/schema";

interface ProjectSelectorProps {
  value?: number;
  onChange: (value: number) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", color: "#6366f1" });
  const { data: projects = [] } = useProjects();
  const createProject = useCreateProject();

  const handleCreateProject = async () => {
    try {
      await createProject.mutateAsync(newProject);
      setOpen(false);
      setNewProject({ name: "", color: "#6366f1" });
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const selectedProject = (projects as Project[]).find((p) => p.id === value);

  return (
    <div className="flex gap-2">
      <Select value={value?.toString()} onValueChange={(v) => onChange(parseInt(v))}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select project">
            {selectedProject && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedProject.color }}
                />
                {selectedProject.name}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(projects as Project[]).map((project) => (
            <SelectItem key={project.id} value={project.id.toString()}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">New Project</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Project name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
            <Input
              type="color"
              value={newProject.color}
              onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
            />
            <Button onClick={handleCreateProject} className="w-full">
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
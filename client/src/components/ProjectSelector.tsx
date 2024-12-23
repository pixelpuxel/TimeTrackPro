import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from "@/lib/api";
import { Trash2, Pencil } from "lucide-react";
import type { Project } from "@db/schema";

interface ProjectSelectorProps {
  value?: number;
  onChange: (value: number) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const [openNewProject, setOpenNewProject] = useState(false);
  const [openProjectList, setOpenProjectList] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: "", color: "#6366f1" });
  const [editName, setEditName] = useState("");

  const { data: projects = [] } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();

  const handleCreateProject = async () => {
    try {
      await createProject.mutateAsync(newProject);
      setOpenNewProject(false);
      setNewProject({ name: "", color: "#6366f1" });
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject.mutateAsync(project.id);
      if (value === project.id) {
        onChange(0);
      }
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleUpdateProject = async (project: Project) => {
    try {
      await updateProject.mutateAsync({ id: project.id, name: editName });
      setProjectToEdit(null);
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const selectedProject = (projects as Project[]).find((p) => p.id === value);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={value?.toString()} onValueChange={(v) => onChange(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Projekt auswählen">
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

        <Dialog open={openNewProject} onOpenChange={setOpenNewProject}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Neues Projekt</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Projekt erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Projektname"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
              <Input
                type="color"
                value={newProject.color}
                onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
              />
              <Button onClick={handleCreateProject} className="w-full">
                Projekt erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openProjectList} onOpenChange={setOpenProjectList}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Projekte verwalten</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {(projects as Project[]).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span>{project.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProjectToEdit(project);
                        setEditName(project.name);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                  <AlertDialog open={projectToDelete?.id === project.id} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setProjectToDelete(project)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Projekt löschen</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sind Sie sicher, dass Sie "{project.name}" löschen möchten? Dadurch werden auch alle zugehörigen Aufgaben gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteProject(project)}>
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!projectToEdit} onOpenChange={(open) => !open && setProjectToEdit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Projekt umbenennen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Neuer Projektname"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <Button onClick={() => projectToEdit && handleUpdateProject(projectToEdit)} className="w-full">
                Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
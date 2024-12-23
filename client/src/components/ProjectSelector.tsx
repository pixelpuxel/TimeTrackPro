import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from "@/lib/api";
import { Plus, Trash2, Pencil, Palette } from "lucide-react";
import type { Project } from "@db/schema";

interface ProjectSelectorProps {
  value?: number;
  onChange: (value: number) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const { toast } = useToast();
  const [openNewProject, setOpenNewProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: "", color: "#6366f1" });
  const [editProject, setEditProject] = useState<{ id: number; name: string; color: string } | null>(null);

  const { data: projects = [], isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();

  // Handle API errors
  if (error) {
    console.error('Project loading error:', error);
  }

  const handleCreateProject = async () => {
    try {
      await createProject.mutateAsync(newProject);
      setOpenNewProject(false);
      setNewProject({ name: "", color: "#6366f1" });
      toast({
        title: "Projekt erstellt",
        description: "Das neue Projekt wurde erfolgreich erstellt."
      });
    } catch (error) {
      console.error('Project creation error:', error);
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht erstellt werden.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProject = async () => {
    if (!editProject) return;

    try {
      await updateProject.mutateAsync({
        id: editProject.id,
        name: editProject.name,
        color: editProject.color
      });
      setEditProject(null);
      toast({
        title: "Projekt aktualisiert",
        description: "Das Projekt wurde erfolgreich aktualisiert."
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject.mutateAsync(project.id);
      setProjectToDelete(null);
      if (project.id === value) {
        const remainingProjects = projects.filter((p: Project) => p.id !== project.id);
        if (remainingProjects.length > 0) {
          onChange(remainingProjects[0].id);
        }
      }
      toast({
        title: "Projekt gelöscht",
        description: "Das Projekt wurde erfolgreich gelöscht."
      });
    } catch (error) {
      console.error('Project deletion error:', error);
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const selectedProject = projects.find((p: Project) => p.id === value);

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={value?.toString()} onValueChange={(v) => onChange(parseInt(v, 10))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Projekt auswählen">
              {selectedProject && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <span>{selectedProject.name}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((project: Project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span>{project.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={openNewProject} onOpenChange={setOpenNewProject}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Neues Projekt
            </Button>
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
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Projektfarbe</label>
                <Input
                  type="color"
                  value={newProject.color}
                  onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                  className="h-10 p-1"
                />
              </div>
              <Button 
                onClick={handleCreateProject} 
                className="w-full"
                disabled={createProject.isPending || !newProject.name}
              >
                {createProject.isPending ? "Wird erstellt..." : "Projekt erstellen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selectedProject && (
          <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectToDelete(selectedProject)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Projekt löschen</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchten Sie das Projekt "{projectToDelete?.name}" wirklich löschen?
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProjectToDelete(null)}>
                  Abbrechen
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {selectedProject && (
          <Dialog open={!!editProject} onOpenChange={(open) => !open && setEditProject(null)}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setEditProject({
                  id: selectedProject.id,
                  name: selectedProject.name,
                  color: selectedProject.color
                })}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Projekt bearbeiten</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Projektname"
                  value={editProject?.name || ''}
                  onChange={(e) => editProject && setEditProject({
                    ...editProject,
                    name: e.target.value
                  })}
                />
                <div className="space-y-2">
                  <label className="text-sm text-gray-500">Projektfarbe</label>
                  <div className="flex items-center space-x-2">
                    <Palette className="h-6 w-6" color={editProject?.color || "#6366f1"} />
                    <Input 
                      type="color" 
                      value={editProject?.color || "#6366f1"} 
                      onChange={(e) => editProject && setEditProject({ 
                        ...editProject, 
                        color: e.target.value 
                      })} 
                      className="w-full"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleUpdateProject}
                  className="w-full"
                  disabled={updateProject.isPending || !editProject?.name}
                >
                  {updateProject.isPending ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
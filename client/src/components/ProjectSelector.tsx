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
import { useToast } from "@/hooks/use-toast";
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from "@/lib/api";
import { Trash2, Pencil } from "lucide-react";
import type { Project } from "@db/schema";

interface ProjectSelectorProps {
  value?: number;
  onChange: (value: number) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const { toast } = useToast();
  const [openNewProject, setOpenNewProject] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: "", color: "#6366f1" });
  const [editName, setEditName] = useState("");

  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();

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
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht erstellt werden.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProject = async (project: Project) => {
    try {
      await updateProject.mutateAsync({ id: project.id, name: editName });
      setProjectToEdit(null);
      toast({
        title: "Projekt aktualisiert",
        description: "Der Projektname wurde erfolgreich geändert."
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Projektname konnte nicht geändert werden.",
        variant: "destructive"
      });
    }
  };

  const selectedProject = projects.find((p) => p.id === value);

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={value?.toString()} onValueChange={(v) => onChange(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Projekt auswählen">
              {selectedProject && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <span className="flex items-center gap-2">
                    {selectedProject.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToEdit(selectedProject);
                        setEditName(selectedProject.name);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex items-center gap-2">
                    {project.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToEdit(project);
                        setEditName(project.name);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                  </span>
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
              <Button 
                onClick={handleCreateProject} 
                className="w-full"
                disabled={createProject.isPending}
              >
                {createProject.isPending ? "Wird erstellt..." : "Projekt erstellen"}
              </Button>
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
              <Button 
                onClick={() => projectToEdit && handleUpdateProject(projectToEdit)} 
                className="w-full"
                disabled={updateProject.isPending}
              >
                {updateProject.isPending ? "Wird gespeichert..." : "Speichern"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
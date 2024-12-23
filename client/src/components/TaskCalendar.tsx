import { motion } from "framer-motion";
import { useTasks, useProjects, useUpdateProject, useDeleteTask } from "@/lib/api";
import { format, startOfYear, endOfYear, eachDayOfInterval, getWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project, Task } from "@db/schema";

interface TaskCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date, projectId: number) => void;
}

export function TaskCalendar({ selectedDate, onSelect }: TaskCalendarProps) {
  const { toast } = useToast();
  const startDate = startOfYear(selectedDate);
  const endDate = endOfYear(selectedDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [taskToDelete, setTaskToDelete] = useState<{ date: Date; projectId: number } | null>(null);

  const { data: tasks = [] } = useTasks(startDate, endDate);
  const { data: projects = [] } = useProjects();
  const updateProject = useUpdateProject();
  const deleteTask = useDeleteTask();

  // Group tasks by project and date
  const tasksByProject = (tasks as Task[]).reduce((acc: Record<number, Record<string, Task[]>>, task: Task) => {
    if (!task.projectId) return acc;
    if (!acc[task.projectId]) acc[task.projectId] = {};
    const dateStr = format(new Date(task.date), "yyyy-MM-dd");
    if (!acc[task.projectId][dateStr]) acc[task.projectId][dateStr] = [];
    acc[task.projectId][dateStr].push(task);
    return acc;
  }, {});

  // Organize days into weeks for the grid layout
  const weeksByProject: { [key: number]: (Date | null)[][] } = {};
  (projects as Project[]).forEach((project) => {
    weeksByProject[project.id] = [];
    let currentWeek: (Date | null)[] = Array(7).fill(null);

    days.forEach((day) => {
      const dayOfWeek = getDay(day);
      currentWeek[dayOfWeek] = day;

      if (dayOfWeek === 6) {
        weeksByProject[project.id].push(currentWeek);
        currentWeek = Array(7).fill(null);
      }
    });

    if (currentWeek.some(day => day !== null)) {
      weeksByProject[project.id].push(currentWeek);
    }
  });

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

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const tasksForDate = tasksByProject[taskToDelete.projectId]?.[format(taskToDelete.date, "yyyy-MM-dd")] || [];

      // Delete all tasks for this date and project
      for (const task of tasksForDate) {
        await deleteTask.mutateAsync(task.id);
      }

      setTaskToDelete(null);
      toast({
        title: "Aufgaben gelöscht",
        description: "Die Aufgaben wurden erfolgreich gelöscht."
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Aufgaben konnten nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full"
    >
      {(projects as Project[]).map((project) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2 sm:p-4 bg-white rounded-lg shadow-sm w-full"
        >
          <div className="space-y-2 sm:space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: project.color }}
              />
              <h3 className="font-semibold">{project.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setProjectToEdit(project);
                  setEditName(project.name);
                }}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="grid grid-cols-52 gap-[1px] bg-gray-200 p-0.5 w-full">
                {weeksByProject[project.id].map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-rows-7 gap-[1px] aspect-[1/7] w-full">
                    {week.map((day, dayIndex) => {
                      if (!day) return <div key={dayIndex} className="bg-gray-100" />;

                      const dateStr = format(day, "yyyy-MM-dd");
                      const tasksForDate = tasksByProject[project.id]?.[dateStr] || [];
                      const hasTask = tasksForDate.length > 0;
                      const isSelected = format(selectedDate, "yyyy-MM-dd") === dateStr;

                      return (
                        <div
                          key={dateStr}
                          className="relative group"
                        >
                          <button
                            onClick={() => onSelect(day, project.id)}
                            className={`
                              w-full h-full
                              ${hasTask ? 'hover:opacity-80' : 'bg-white hover:bg-gray-50'}
                              ${isSelected ? 'ring-1 ring-blue-500' : ''}
                              transition-colors
                            `}
                            style={{
                              backgroundColor: hasTask ? project.color : undefined,
                            }}
                            title={`${format(day, "d. MMMM yyyy", { locale: de })}${hasTask ? ` (${tasksForDate.length} Aufgaben)` : ''}`}
                          />
                          {hasTask && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-0 right-0 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskToDelete({ date: day, projectId: project.id });
                              }}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}

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

      <AlertDialog 
        open={!!taskToDelete} 
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgaben löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie wirklich alle Aufgaben für den {taskToDelete ? format(taskToDelete.date, "d. MMMM yyyy", { locale: de }) : ""} löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>
              {deleteTask.isPending ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="text-xs sm:text-sm text-gray-600">
        Ausgewählt: {format(selectedDate, "d. MMMM yyyy", { locale: de })}
      </div>
    </motion.div>
  );
}
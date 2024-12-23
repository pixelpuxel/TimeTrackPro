import { motion } from "framer-motion";
import { useTasks, useProjects, useUpdateProject } from "@/lib/api";
import { format, startOfYear, endOfYear, eachDayOfInterval, getWeek, getDay, addYears, subYears } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Pencil, ChevronLeft, ChevronRight, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project, Task } from "@db/schema";

interface TaskCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date, projectId: number) => void;
}

export function TaskCalendar({ selectedDate, onSelect }: TaskCalendarProps) {
  const { toast } = useToast();
  const [currentYear, setCurrentYear] = useState(new Date(selectedDate));
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  // Calculate year boundaries for the current year view
  const startDate = startOfYear(currentYear);
  const endDate = endOfYear(currentYear);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(startDate, endDate);
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const updateProject = useUpdateProject();

  // Group tasks by project and date
  const tasksByProject = (tasks as Task[]).reduce((acc: Record<number, Record<string, number>>, task: Task) => {
    if (!task.projectId) return acc;
    if (!acc[task.projectId]) acc[task.projectId] = {};
    const dateStr = format(new Date(task.date), "yyyy-MM-dd");
    acc[task.projectId][dateStr] = (acc[task.projectId][dateStr] || 0) + 1;
    return acc;
  }, {});

  const handleUpdateProject = async (project: Project) => {
    if (!editName.trim() || !editColor.trim()) return;

    try {
      await updateProject.mutateAsync({ 
        id: project.id, 
        name: editName,
        color: editColor 
      });
      setProjectToEdit(null);
      toast({
        title: "Projekt aktualisiert",
        description: "Der Projektname und die Farbe wurden erfolgreich geändert."
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    }
  };

  // Organize days by week for vertical layout
  const weeksByProject: Record<number, Record<number, Date[]>> = {};
  (projects as Project[]).forEach((project) => {
    weeksByProject[project.id] = {};
    days.forEach((day) => {
      const weekNum = getWeek(day, { locale: de });
      if (!weeksByProject[project.id][weekNum]) {
        weeksByProject[project.id][weekNum] = Array(7).fill(null);
      }
      const dayIndex = getDay(day);
      weeksByProject[project.id][weekNum][dayIndex] = day;
    });
  });

  if (isLoadingTasks || isLoadingProjects) {
    return <div className="p-4 text-center">Lädt...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentYear(subYears(currentYear, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {format(currentYear, "yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentYear(addYears(currentYear, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

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
                  setEditColor(project.color);
                }}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="grid grid-cols-52 gap-[1px] bg-gray-200 p-0.5 w-full">
                {Object.values(weeksByProject[project.id]).map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-rows-7 gap-[1px] aspect-[1/7] w-full">
                    {week.map((day, dayIndex) => {
                      if (!day) return <div key={dayIndex} className="bg-gray-100" />;

                      const dateStr = format(day, "yyyy-MM-dd");
                      const hasTask = !!(tasksByProject[project.id]?.[dateStr]);
                      const isSelected = format(selectedDate, "yyyy-MM-dd") === dateStr;
                      const currentYearStart = startOfYear(currentYear);
                      const currentYearEnd = endOfYear(currentYear);
                      const isOutsideYear = day < currentYearStart || day > currentYearEnd;

                      return (
                        <button
                          key={dateStr}
                          onClick={() => !isOutsideYear && onSelect(day, project.id)}
                          disabled={isOutsideYear}
                          className={`
                            aspect-square
                            ${hasTask ? 'hover:opacity-80' : 'bg-white hover:bg-gray-50'}
                            ${isSelected ? 'ring-2 ring-blue-500' : ''}
                            ${isOutsideYear ? 'opacity-50 cursor-not-allowed bg-gray-200' : ''}
                            transition-colors
                          `}
                          style={{
                            backgroundColor: hasTask && !isOutsideYear ? project.color : undefined,
                          }}
                          title={`${format(day, "d. MMMM yyyy", { locale: de })}${hasTask ? ` (${tasksByProject[project.id][dateStr]} Aufgaben)` : ''}`}
                        />
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
            <DialogTitle>Projekt bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Projektname"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Projektfarbe</label>
              <div className="flex items-center space-x-2">
                <Palette className="h-6 w-6" color={editColor} />
                <Input 
                  type="color" 
                  value={editColor} 
                  onChange={(e) => setEditColor(e.target.value)} 
                  className="h-10 p-1"
                />
              </div>
            </div>
            <Button 
              onClick={() => projectToEdit && handleUpdateProject(projectToEdit)} 
              className="w-full"
              disabled={updateProject.isPending || !editName.trim() || !editColor.trim()}
            >
              {updateProject.isPending ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-xs sm:text-sm text-gray-600">
        Ausgewählt: {format(selectedDate, "d. MMMM yyyy", { locale: de })}
      </div>
    </motion.div>
  );
}
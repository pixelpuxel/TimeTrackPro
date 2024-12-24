import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, startOfYear, endOfYear, addDays, addYears, subYears, isSameYear, isWithinInterval, isSameDay, isLeapYear } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, ChevronLeft, ChevronRight, Palette, CheckCircle2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project, Task } from "@db/schema";
import { DateRangePreview } from "./DateRangePreview";
import { useTasks, useProjects, useUpdateProject } from "@/lib/api";

interface TaskCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date, projectId: number) => void;
}

export function TaskCalendar({ selectedDate, onSelect }: TaskCalendarProps) {
  const { toast } = useToast();
  const [currentYear, setCurrentYear] = useState<Date>(new Date(selectedDate));
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startDate = startOfYear(currentYear);
  const endDate = endOfYear(currentYear);
  const daysInYear = isLeapYear(currentYear) ? 366 : 365;
  const daysPerColumn = 7;
  const columnsNeeded = Math.ceil(daysInYear / daysPerColumn);
  const days = Array.from({ length: daysInYear }, (_, i) => addDays(startDate, i));
  const columns = Array.from({ length: columnsNeeded }, (_, colIndex) => {
    const start = colIndex * daysPerColumn;
    return days.slice(start, start + daysPerColumn);
  });

  const { data: tasks = [], isLoading: isLoadingTasks, error: tasksError } = useTasks(startDate, endDate);
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useProjects();
  const updateProject = useUpdateProject();

  useEffect(() => {
    if (tasksError) {
      console.error('Tasks loading error:', tasksError);
      setError('Failed to load tasks. Please try again later.');
    }
    if (projectsError) {
      console.error('Projects loading error:', projectsError);
      setError('Failed to load projects. Please try again later.');
    }
  }, [tasksError, projectsError]);

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
      console.error('Project update error:', error);
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    }
  };

  const handleDateClick = (date: Date, projectId: number) => {
    if (!rangeStart) {
      setRangeStart(date);
      setRangeEnd(null);
    } else if (!rangeEnd) {
      if (date < rangeStart) {
        setRangeEnd(rangeStart);
        setRangeStart(date);
      } else {
        setRangeEnd(date);
      }
      onSelect(date, projectId);
    } else {
      setRangeStart(date);
      setRangeEnd(null);
    }
  };

  const isInRange = (date: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    return isWithinInterval(date, { start: rangeStart, end: rangeEnd });
  };

  if (isLoadingTasks || isLoadingProjects) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
        <Button onClick={() => setError(null)} className="mt-4">
          Erneut versuchen
        </Button>
      </div>
    );
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

      <DateRangePreview 
        startDate={rangeStart} 
        endDate={rangeEnd}
        className="mb-4" 
      />

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

            <div className="grid grid-cols-[repeat(auto-fit,minmax(20px,1fr))] gap-px bg-gray-200 p-0.5 rounded-lg">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-px">
                  {column.map((day, index) => {
                    if (!day) return null;
                    const dateStr = format(day, "yyyy-MM-dd");
                    const hasTask = !!(tasksByProject[project.id]?.[dateStr]);
                    const isSelected = format(selectedDate, "yyyy-MM-dd") === dateStr;
                    const isOutsideYear = !isSameYear(day, currentYear);
                    const isRangeStart = rangeStart && isSameDay(day, rangeStart);
                    const isRangeEnd = rangeEnd && isSameDay(day, rangeEnd);
                    const isInSelectedRange = isInRange(day);
                    const dayNumber = colIndex * daysPerColumn + index + 1;

                    return (
                      <TooltipProvider key={dateStr}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => !isOutsideYear && handleDateClick(day, project.id)}
                              disabled={isOutsideYear}
                              className={`
                                aspect-square relative
                                ${hasTask ? 'hover:opacity-80' : 'bg-white hover:bg-gray-50'}
                                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                                ${isOutsideYear ? 'opacity-50 cursor-not-allowed bg-gray-200' : ''}
                                ${isRangeStart ? 'rounded-t-md' : ''}
                                ${isRangeEnd ? 'rounded-b-md' : ''}
                                ${isInSelectedRange ? 'bg-blue-100' : ''}
                                transition-colors
                                group
                                text-[10px] sm:text-xs
                              `}
                              style={{
                                backgroundColor: hasTask && !isOutsideYear ? project.color : undefined,
                              }}
                            >
                              <span className="absolute inset-0 flex items-center justify-center">
                                {dayNumber}
                              </span>
                              {(isRangeStart || isRangeEnd) && (
                                <div className="absolute inset-0 bg-blue-500 opacity-20 rounded-md" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="p-2">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {format(day, "d. MMMM yyyy", { locale: de })}
                              </div>
                              {hasTask && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span>{tasksByProject[project.id][dateStr]} Aufgaben</span>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
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
    </motion.div>
  );
}
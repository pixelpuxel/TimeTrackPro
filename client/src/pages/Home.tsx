import { useState, useRef } from "react";
import { TaskCalendar } from "@/components/TaskCalendar";
import { TaskTable } from "@/components/TaskTable";
import { TaskInput } from "@/components/TaskInput";
import { useTasks, exportToCSV, useImportCSV } from "@/lib/api";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Calendar, List } from "lucide-react";
import type { Task } from "@db/schema";

export function Home() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProject, setSelectedProject] = useState<number>();
  const [showTable, setShowTable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importCSV = useImportCSV();

  // Fetch all tasks for table view, but only selected date tasks for calendar
  const { data: tasks = [] } = useTasks(
    showTable ? undefined : selectedDate,
    showTable ? undefined : selectedDate
  );

  const tasksByProject = (tasks as Task[]).reduce((acc: Record<string, Task[]>, task: Task) => {
    if (!task.projectId) return acc;
    const projectId = task.projectId.toString();
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(task);
    return acc;
  }, {});

  const handleCalendarSelect = (date: Date, projectId: number) => {
    setSelectedDate(date);
    setSelectedProject(projectId);
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importCSV.mutateAsync(file);
      toast({
        title: "Import erfolgreich",
        description: "Die Daten wurden erfolgreich importiert."
      });
    } catch (error) {
      toast({
        title: "Fehler beim Import",
        description: "Die Daten konnten nicht importiert werden.",
        variant: "destructive"
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Zeiterfassung</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-2"
            >
              {showTable ? (
                <>
                  <Calendar className="h-4 w-4" />
                  Als Kalender anzeigen
                </>
              ) : (
                <>
                  <List className="h-4 w-4" />
                  Als Tabelle anzeigen
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              ref={fileInputRef}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
              disabled={importCSV.isPending}
            >
              <Upload className="h-4 w-4" />
              {importCSV.isPending ? "Importiere..." : "Import CSV"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-6">
          <div>
            {showTable ? (
              <TaskTable tasks={tasks as Task[]} />
            ) : (
              <TaskCalendar
                selectedDate={selectedDate}
                onSelect={handleCalendarSelect}
              />
            )}
            <div className="mt-4 text-sm text-gray-600">
              {!showTable && "* Farbige Quadrate zeigen abgeschlossene Aufgaben"}
            </div>
          </div>

          <div className="space-y-6">
            <TaskInput 
              date={selectedDate} 
              onDateChange={setSelectedDate}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
            />

            <AnimatePresence>
              {Object.entries(tasksByProject).map(([projectId, projectTasks], index) => (
                <motion.div
                  key={projectId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-4 rounded-lg shadow-sm"
                >
                  <h3 className="font-semibold text-lg mb-3">Projekt {projectId}</h3>
                  <div>
                    Aufgabe abgeschlossen am {format(selectedDate, "d. MMMM yyyy", { locale: de })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
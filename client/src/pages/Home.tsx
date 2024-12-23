import { useState } from "react";
import { TaskCalendar } from "@/components/TaskCalendar";
import { TaskInput } from "@/components/TaskInput";
import { useTasks } from "@/lib/api";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import type { Task } from "@db/schema";

export function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Only fetch tasks for the selected date
  const { data: tasks = [] } = useTasks(selectedDate, selectedDate);

  const tasksByProject = (tasks as Task[]).reduce((acc: Record<string, Task[]>, task: Task) => {
    if (!task.projectId) return acc;
    const projectId = task.projectId.toString();
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(task);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Zeiterfassung</h1>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-6">
          <div>
            <TaskCalendar
              selectedDate={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
            />
            <div className="mt-4 text-sm text-gray-600">
              * Farbige Quadrate zeigen abgeschlossene Aufgaben
            </div>
          </div>

          <div className="space-y-6">
            <TaskInput 
              date={selectedDate} 
              onDateChange={setSelectedDate}
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
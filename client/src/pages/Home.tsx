import { useState } from "react";
import { TaskCalendar } from "@/components/TaskCalendar";
import { TaskInput } from "@/components/TaskInput";
import { useTasks } from "@/lib/api";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Task } from "@db/schema";

export function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: tasks = [] } = useTasks(selectedDate, selectedDate);

  const tasksByProject = (tasks as Task[]).reduce((acc: Record<string, Task[]>, task: Task) => {
    const projectName = task.project?.name || "No Project";
    if (!acc[projectName]) acc[projectName] = [];
    acc[projectName].push(task);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Time Tracker</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <TaskCalendar
              selectedDate={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
            />
          </div>

          <div className="space-y-6">
            <TaskInput date={selectedDate} />

            <AnimatePresence>
              {Object.entries(tasksByProject).map(([projectName, projectTasks], index) => (
                <motion.div
                  key={projectName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-4 rounded-lg shadow-sm"
                >
                  <h3 className="font-semibold text-lg mb-3">{projectName}</h3>
                  <div className="space-y-2">
                    {projectTasks.map((task: Task) => (
                      <div
                        key={task.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span>{task.title}</span>
                        <span className="text-sm text-gray-500">
                          {task.duration} minutes
                        </span>
                      </div>
                    ))}
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
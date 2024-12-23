import { motion } from "framer-motion";
import { useTasks, useProjects } from "@/lib/api";
import { format, startOfYear, endOfYear, eachDayOfInterval } from "date-fns";
import type { Project, Task } from "@db/schema";

interface TaskCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date | undefined) => void;
}

export function TaskCalendar({ selectedDate, onSelect }: TaskCalendarProps) {
  const startDate = startOfYear(selectedDate);
  const endDate = endOfYear(selectedDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const { data: tasks = [] } = useTasks(startDate, endDate);
  const { data: projects = [] } = useProjects();

  // Group tasks by project and date
  const tasksByProject = (tasks as Task[]).reduce((acc: Record<number, Record<string, number>>, task: Task) => {
    if (!task.projectId) return acc;
    if (!acc[task.projectId]) acc[task.projectId] = {};
    const dateStr = format(new Date(task.date), "yyyy-MM-dd");
    acc[task.projectId][dateStr] = (acc[task.projectId][dateStr] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {(projects as Project[]).map((project) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2 sm:p-4 bg-white rounded-lg shadow-sm"
        >
          <div className="space-y-2 sm:space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: project.color }}
              />
              <h3 className="font-semibold">{project.name}</h3>
            </div>

            <div className="grid grid-cols-53 gap-[1px] bg-gray-200 rounded-lg p-0.5 sm:p-1 min-w-[300px] overflow-x-auto">
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const hasTask = !!(tasksByProject[project.id]?.[dateStr]);
                const isSelected = format(selectedDate, "yyyy-MM-dd") === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => onSelect(day)}
                    className={`
                      w-2 h-2 sm:w-3 sm:h-3 rounded-[2px] flex items-center justify-center
                      ${hasTask ? 'hover:opacity-80' : 'bg-white hover:bg-gray-50'}
                      ${isSelected ? 'ring-1 ring-blue-500' : ''}
                      transition-colors
                    `}
                    style={{
                      backgroundColor: hasTask ? project.color : undefined,
                    }}
                    title={`${format(day, "MMMM d, yyyy")}${hasTask ? ` (${tasksByProject[project.id][dateStr]} tasks)` : ''}`}
                  >
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      ))}

      <div className="text-xs sm:text-sm text-gray-600">
        Selected: {format(selectedDate, "MMMM d, yyyy")}
      </div>
    </motion.div>
  );
}
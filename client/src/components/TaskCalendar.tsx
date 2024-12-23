import { motion } from "framer-motion";
import { useTasks } from "@/lib/api";
import { format, startOfYear, endOfYear, eachDayOfInterval } from "date-fns";

interface TaskCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date | undefined) => void;
}

export function TaskCalendar({ selectedDate, onSelect }: TaskCalendarProps) {
  const startDate = startOfYear(selectedDate);
  const endDate = endOfYear(selectedDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const { data: tasks = [] } = useTasks(startDate, endDate);

  const tasksByDate = tasks.reduce((acc: Record<string, number>, task: any) => {
    const date = format(new Date(task.date), "yyyy-MM-dd");
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-2 sm:p-4 bg-white rounded-lg shadow-sm"
    >
      <div className="space-y-2 sm:space-y-4">
        <div className="grid grid-cols-53 gap-[1px] bg-gray-200 rounded-lg p-0.5 sm:p-1 min-w-[300px] overflow-x-auto">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const hasTask = !!tasksByDate[dateStr];
            const isSelected = format(selectedDate, "yyyy-MM-dd") === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => onSelect(day)}
                className={`
                  w-2 h-2 sm:w-3 sm:h-3 rounded-[2px] flex items-center justify-center
                  ${hasTask ? 'bg-blue-100 hover:bg-blue-200' : 'bg-white hover:bg-gray-50'}
                  ${isSelected ? 'ring-1 ring-blue-500' : ''}
                  transition-colors
                `}
                title={`${format(day, "MMMM d, yyyy")}${hasTask ? ` (${tasksByDate[dateStr]} tasks)` : ''}`}
              >
                {hasTask && (
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
            );
          })}
        </div>
        <div className="text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
            <span>Has tasks</span>
          </div>
          <div>Selected: {format(selectedDate, "MMMM d, yyyy")}</div>
        </div>
      </div>
    </motion.div>
  );
}
import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { useTasks } from "@/lib/api";
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";

interface TaskCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date | undefined) => void;
}

export function TaskCalendar({ selectedDate, onSelect }: TaskCalendarProps) {
  const startDate = startOfYear(selectedDate);
  const endDate = endOfYear(selectedDate);
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

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
      className="p-4 bg-white rounded-lg shadow-sm"
    >
      <div className="grid grid-cols-3 gap-4 max-h-[800px] overflow-y-auto">
        {months.map((month) => (
          <div key={month.toISOString()} className="p-2">
            <h3 className="text-sm font-semibold mb-2">
              {format(month, "MMMM yyyy")}
            </h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onSelect}
              month={month}
              className="w-full"
              modifiers={{
                hasTask: (date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  return !!tasksByDate[dateStr];
                }
              }}
              modifiersStyles={{
                hasTask: {
                  backgroundColor: "rgb(219 234 254)",
                  color: "rgb(29 78 216)",
                  fontWeight: "bold"
                }
              }}
              // Disable navigation since we're showing all months
              disabled={{
                before: startOfMonth(month),
                after: endOfMonth(month)
              }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
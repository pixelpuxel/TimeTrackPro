import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { useTasks } from "@/lib/api";
import { format, startOfYear, endOfYear } from "date-fns";

interface TaskCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date | undefined) => void;
}

export function TaskCalendar({ selectedDate, onSelect }: TaskCalendarProps) {
  const startDate = startOfYear(selectedDate);
  const endDate = endOfYear(selectedDate);

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
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        className="rounded-md"
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
      />
    </motion.div>
  );
}
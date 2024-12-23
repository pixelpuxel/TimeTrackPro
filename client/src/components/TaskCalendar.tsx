import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { useTasks } from "@/lib/api";
import { format } from "date-fns";

interface TaskCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date | undefined) => void;
}

export function TaskCalendar({ selectedDate, onSelect }: TaskCalendarProps) {
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  
  const { data: tasks = [] } = useTasks(startOfMonth, endOfMonth);

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

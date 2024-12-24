import { useState } from "react";
import { motion } from "framer-motion";
import { format, startOfYear, endOfYear } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "./ProjectSelector";
import { useCreateTask } from "@/lib/api";
import type { InsertTask } from "@db/schema";
import { Calendar } from "@/components/ui/calendar";
import { PopoverTrigger, PopoverContent, Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Celebration } from "./Celebration";

interface TaskInputProps {
  date: Date;
  onDateChange: (date: Date) => void;
  selectedProject?: number;
  onProjectChange: (projectId: number) => void;
}

export function TaskInput({ date, onDateChange, selectedProject, onProjectChange }: TaskInputProps) {
  const createTask = useCreateTask();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'daily' | 'streak' | 'monthly' | 'yearly'>('daily');
  const [celebrationMessage, setCelebrationMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      await createTask.mutateAsync({
        date: new Date(date),
        projectId: selectedProject
      } as InsertTask);

      // Determine achievement type based on completion patterns
      const now = new Date();
      if (format(date, 'yyyy') === format(now, 'yyyy')) {
        setShowCelebration(true);
        setCelebrationType('yearly');
        setCelebrationMessage('You completed your first task for the year!');
      } else if (format(date, 'MM') === format(now, 'MM')) {
        setShowCelebration(true);
        setCelebrationType('monthly');
        setCelebrationMessage('Monthly milestone reached!');
      } else {
        setShowCelebration(true);
        setCelebrationType('daily');
        setCelebrationMessage('Task completed! Keep up the momentum!');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const yearStart = startOfYear(date);
  const yearEnd = endOfYear(date);

  return (
    <>
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 p-4 bg-white rounded-lg shadow-sm"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold">
          Aufgabe markieren für {format(date, "d. MMMM yyyy", { locale: de })}
        </h2>

        <div className="space-y-3">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP", { locale: de })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                defaultMonth={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    onDateChange(newDate);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
                locale={de}
                fromDate={yearStart}
                toDate={yearEnd}
              />
            </PopoverContent>
          </Popover>

          <ProjectSelector
            value={selectedProject}
            onChange={onProjectChange}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={createTask.isPending || !selectedProject}
          >
            {createTask.isPending ? "Wird gespeichert..." : "Als erledigt markieren"}
          </Button>
        </div>
      </motion.form>

      {showCelebration && (
        <Celebration
          type={celebrationType}
          message={celebrationMessage}
          onComplete={() => setShowCelebration(false)}
        />
      )}
    </>
  );
}
import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "./ProjectSelector";
import { useCreateTask } from "@/lib/api";
import type { InsertTask } from "@db/schema";

interface TaskInputProps {
  date: Date;
}

export function TaskInput({ date }: TaskInputProps) {
  const [task, setTask] = useState<Partial<InsertTask>>({
    title: "",
    projectId: undefined,
    date: date
  });

  const createTask = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.title || !task.projectId) return;

    await createTask.mutateAsync({
      ...task,
      date: new Date(date),
      projectId: task.projectId
    } as InsertTask);

    setTask({
      title: "",
      projectId: task.projectId,
      date: date
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-4 bg-white rounded-lg shadow-sm"
      onSubmit={handleSubmit}
    >
      <h2 className="text-lg font-semibold">
        Add Task for {format(date, "MMMM d, yyyy")}
      </h2>

      <div className="space-y-3">
        <Input
          placeholder="Task title"
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
        />

        <ProjectSelector
          value={task.projectId}
          onChange={(projectId) => setTask({ ...task, projectId })}
        />

        <Button type="submit" className="w-full">
          Add Task
        </Button>
      </div>
    </motion.form>
  );
}
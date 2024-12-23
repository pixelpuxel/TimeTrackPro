import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "./ProjectSelector";
import { useCreateTask } from "@/lib/api";
import type { InsertTask } from "@db/schema";

interface TaskInputProps {
  date: Date;
}

export function TaskInput({ date }: TaskInputProps) {
  const [projectId, setProjectId] = useState<number>();
  const createTask = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    await createTask.mutateAsync({
      date: new Date(date),
      projectId: projectId
    } as InsertTask);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-4 bg-white rounded-lg shadow-sm"
      onSubmit={handleSubmit}
    >
      <h2 className="text-lg font-semibold">
        Mark task for {format(date, "MMMM d, yyyy")}
      </h2>

      <div className="space-y-3">
        <ProjectSelector
          value={projectId}
          onChange={setProjectId}
        />

        <Button type="submit" className="w-full">
          Mark as Complete
        </Button>
      </div>
    </motion.form>
  );
}
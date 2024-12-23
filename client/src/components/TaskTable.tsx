import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Task } from "@db/schema";

interface TaskTableProps {
  tasks: Task[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  // Sort tasks by date in descending order
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Datum</TableHead>
            <TableHead>Projekt</TableHead>
            <TableHead>Projektfarbe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                {format(new Date(task.date), "d. MMMM yyyy", { locale: de })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.project?.color }}
                  />
                  {task.project?.name}
                </div>
              </TableCell>
              <TableCell>{task.project?.color}</TableCell>
            </TableRow>
          ))}
          {sortedTasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-500">
                Keine Aufgaben gefunden
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
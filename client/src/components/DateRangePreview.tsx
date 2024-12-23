import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRangePreviewProps {
  startDate?: Date;
  endDate?: Date;
  className?: string;
}

export function DateRangePreview({ startDate, endDate, className }: DateRangePreviewProps) {
  if (!startDate && !endDate) return null;

  return (
    <div className={cn("p-4 bg-white rounded-lg shadow-sm", className)}>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500">Ausgewählter Zeitraum</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-xs text-gray-500">Von</div>
            <div className="font-medium">
              {startDate ? format(startDate, "d. MMMM yyyy", { locale: de }) : "Nicht ausgewählt"}
            </div>
          </div>
          <div className="h-px w-4 bg-gray-300" />
          <div className="flex-1">
            <div className="text-xs text-gray-500">Bis</div>
            <div className="font-medium">
              {endDate ? format(endDate, "d. MMMM yyyy", { locale: de }) : "Nicht ausgewählt"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

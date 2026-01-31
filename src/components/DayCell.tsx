import { DayOccupancy } from "@/lib/google-calendar";
import { TodoistTask } from "@/lib/todoist-types";
import { format, isToday, isSameMonth, isWeekend } from "date-fns";
import { useState, useRef } from "react";
import { TaskModal } from "./TaskModal";
import { ListTodo } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_CONFIG } from "@/lib/config";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  occupancy?: DayOccupancy;
  tasks?: TodoistTask[];
}

export function DayCell({ date, currentMonth, occupancy, tasks = [] }: DayCellProps) {
  const [showTasks, setShowTasks] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const isWeekendDay = isWeekend(date);

  const total = occupancy?.total || 0;
  const calendars = occupancy?.calendars || [];
  const taskCount = tasks.length;

  // Scale: 0 to alertThreshold hours. Default 8 hours is 100% width.
  const threshold = APP_CONFIG.alertThreshold;

  const handleCellClick = () => {
    if (taskCount > 0) {
      if (cellRef.current) {
        setAnchorRect(cellRef.current.getBoundingClientRect());
      }
      setShowTasks(true);
    }
  };

  return (
    <>
      <div
        ref={cellRef}
        onClick={handleCellClick}
        className={cn(
          "h-32 border-r border-b p-2 flex flex-col transition-colors",
          !isCurrentMonth && "bg-gray-50 text-gray-400",
          isCurrentMonth && isWeekendDay && !isTodayDate && "bg-amber-50/30",
          isTodayDate && "bg-blue-50/30",
          taskCount > 0 && "cursor-pointer hover:bg-gray-100/50"
        )}
      >
        <div className="grid grid-cols-3 items-center mb-1">
          <span
            className={cn(
              "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full shrink-0",
              isTodayDate && "bg-blue-600 text-white"
            )}
          >
            {format(date, "d")}
          </span>
          
          <div className="flex justify-center">
            {taskCount > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <ListTodo className="w-3 h-3" />
                <span className="text-[10px] font-bold">{taskCount}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            {total > 0 && (
              <span className="text-[10px] font-bold px-1 rounded text-gray-500 bg-gray-100 shrink-0">
                {total}h
              </span>
            )}
          </div>
        </div>

        {/* Occupancy Bars */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {calendars.filter(cal => cal.hours > 0).map((cal) => {
            const width = Math.min((cal.hours / threshold) * 100, 100);
            return (
              <div key={cal.id} className="flex flex-col">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[9px] truncate text-gray-500 max-w-[60px]" title={cal.summary}>
                    {cal.summary}
                  </span>
                  <span className={cn(
                    "text-[9px] font-bold",
                    cal.hours > threshold ? "text-red-600" : "text-gray-700"
                  )}>
                    {cal.hours}h
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ 
                      width: `${width}%`,
                      backgroundColor: cal.color
                    }}
                    title={`${cal.summary}: ${cal.hours}h`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showTasks && (
        <TaskModal 
          date={date} 
          tasks={tasks} 
          onClose={() => setShowTasks(false)}
          anchorRect={anchorRect}
        />
      )}
    </>
  );
}

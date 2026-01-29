import { DayOccupancy } from "@/lib/google-calendar";
import { format, isToday, isSameMonth } from "date-fns";
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
}

export function DayCell({ date, currentMonth, occupancy }: DayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);

  const total = occupancy?.total || 0;
  const calendars = occupancy?.calendars || [];

  // Scale: 0 to alertThreshold hours. Default 8 hours is 100% width.
  const threshold = APP_CONFIG.alertThreshold;

  return (
    <div
      className={cn(
        "h-32 border-r border-b p-2 flex flex-col transition-colors",
        !isCurrentMonth && "bg-gray-50 text-gray-400",
        isTodayDate && "bg-blue-50/30"
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <span
          className={cn(
            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
            isTodayDate && "bg-blue-600 text-white"
          )}
        >
          {format(date, "d")}
        </span>
        {total > 0 && (
          <span className="text-[10px] font-bold px-1 rounded text-gray-500 bg-gray-100">
            {total}h
          </span>
        )}
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
  );
}

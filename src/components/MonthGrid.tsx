import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format,
  isSameMonth
} from "date-fns";
import { DayCell } from "./DayCell";
import { DayOccupancy } from "@/lib/google-calendar";

interface MonthGridProps {
  month: Date;
  occupancyData: Record<string, DayOccupancy>;
}

export function MonthGrid({ month, occupancyData }: MonthGridProps) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 px-4 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10 border-b">
        {format(month, "MMMM yyyy")}
      </h2>
      <div className="grid grid-cols-7 border-l border-t">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-bold text-gray-500 border-r border-b uppercase tracking-wider bg-gray-50">
            {day}
          </div>
        ))}
        {days.map((day) => (
          <DayCell 
            key={day.toISOString()} 
            date={day} 
            currentMonth={month}
            occupancy={occupancyData[day.toISOString()]}
          />
        ))}
      </div>
    </div>
  );
}

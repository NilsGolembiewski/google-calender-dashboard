"use client";

import { useState } from "react";
import { InfiniteCalendar } from "./InfiniteCalendar";
import { CalendarSelector } from "./CalendarSelector";

export function Dashboard() {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(['primary']);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100-64px)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r overflow-y-auto max-h-[40vh] md:max-h-none">
        <CalendarSelector 
          selectedIds={selectedCalendarIds} 
          onSelectionChange={setSelectedCalendarIds} 
        />
      </aside>

      {/* Main Calendar Area */}
      <div className="flex-1 overflow-y-auto">
        <InfiniteCalendar selectedCalendarIds={selectedCalendarIds} />
      </div>
    </div>
  );
}

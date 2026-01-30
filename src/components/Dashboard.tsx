"use client";

import { useState, useEffect } from "react";
import { InfiniteCalendar } from "./InfiniteCalendar";
import { CalendarSelector } from "./CalendarSelector";
import { TodoistTask } from "@/lib/todoist-types";
import { getTodoistData } from "@/app/actions";

export function Dashboard() {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(['primary']);
  const [todoistUrl, setTodoistUrl] = useState<string>("");
  const [todoistTasks, setTodoistTasks] = useState<Record<string, TodoistTask[]>>({});

  // Load Todoist URL from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem("todoist_ical_url");
    if (savedUrl) {
      setTodoistUrl(savedUrl);
    }
  }, []);

  // Persist Todoist URL and fetch data when it changes
  useEffect(() => {
    if (todoistUrl) {
      localStorage.setItem("todoist_ical_url", todoistUrl);
      const fetchTasks = async () => {
        try {
          const tasks = await getTodoistData(todoistUrl);
          setTodoistTasks(tasks);
        } catch (error) {
          console.error("Failed to fetch Todoist tasks", error);
        }
      };
      fetchTasks();
    } else {
      localStorage.removeItem("todoist_ical_url");
      setTodoistTasks({});
    }
  }, [todoistUrl]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r overflow-y-auto max-h-[40vh] md:max-h-none md:flex-none">
        <CalendarSelector 
          selectedIds={selectedCalendarIds} 
          onSelectionChange={setSelectedCalendarIds} 
          todoistUrl={todoistUrl}
          onTodoistUrlChange={setTodoistUrl}
        />
      </aside>

      {/* Main Calendar Area */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto">
          <InfiniteCalendar 
            selectedCalendarIds={selectedCalendarIds} 
            todoistTasks={todoistTasks}
          />
        </div>
      </div>
    </div>
  );
}

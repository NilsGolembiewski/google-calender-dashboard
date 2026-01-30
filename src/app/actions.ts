"use server";

import { auth } from "@/auth";
import { getCalendarEvents, calculateOccupancy, DayOccupancy, getCalendarList } from "@/lib/google-calendar";
import { fetchTodoistTasks, TodoistTask } from "@/lib/todoist";
import { eachDayOfInterval, parseISO } from "date-fns";
import { APP_CONFIG } from "@/lib/config";

export async function getCalendars() {
  const session = await auth();

  if (!session?.accessToken && !APP_CONFIG.isDebug) {
    throw new Error("Not authenticated");
  }

  return await getCalendarList(session?.accessToken || 'mock-token');
}

export async function getTodoistData(icalUrl: string): Promise<Record<string, TodoistTask[]>> {
  const session = await auth();

  if (!session?.accessToken && !APP_CONFIG.isDebug) {
    throw new Error("Not authenticated");
  }

  if (!icalUrl) return {};

  // SSRF Protection (8.1): Validate URL prefix
  if (!icalUrl.startsWith("https://ext.todoist.com/")) {
    console.error(`Blocked suspicious Todoist iCal URL: ${icalUrl}`);
    throw new Error("Invalid Todoist iCal URL");
  }

  return await fetchTodoistTasks(icalUrl);
}

export async function getOccupancyData(
  startDateStr: string, 
  endDateStr: string, 
  calendarIds: string[] = ['primary']
): Promise<DayOccupancy[]> {
  const session = await auth();

  if (!session?.accessToken && !APP_CONFIG.isDebug) {
    throw new Error("Not authenticated");
  }

  const accessToken = session?.accessToken || 'mock-token';

  // 1. Fetch events and calendar list in parallel
  const [eventsByCalendar, calendars] = await Promise.all([
    getCalendarEvents(accessToken, calendarIds, startDateStr, endDateStr),
    getCalendarList(accessToken)
  ]);

  // 2. Create metadata map
  const calendarMetadata: Record<string, { summary: string; color: string }> = {};
  calendars.forEach((c: any) => {
    calendarMetadata[c.id] = {
      summary: c.summary,
      color: c.backgroundColor || '#3b82f6'
    };
  });

  const days = eachDayOfInterval({
    start: parseISO(startDateStr),
    end: parseISO(endDateStr),
  });

  return days.map(day => calculateOccupancy(eventsByCalendar, calendarMetadata, day));
}

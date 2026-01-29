import { google } from 'googleapis';
import { 
  startOfDay, 
  endOfDay, 
  parseISO, 
  differenceInMinutes,
  eachDayOfInterval,
  isWeekend,
  setHours,
  setMinutes
} from 'date-fns';

function generateMockEvents(calendarIds: string[], timeMin: string, timeMax: string) {
  const start = parseISO(timeMin);
  const end = parseISO(timeMax);
  const days = eachDayOfInterval({ start, end });
  const eventsByCalendar: Record<string, any[]> = {};

  calendarIds.forEach(id => {
    eventsByCalendar[id] = [];
  });

  days.forEach(day => {
    if (isWeekend(day)) return;

    // Primary calendar events
    if (eventsByCalendar['primary']) {
      eventsByCalendar['primary'].push({
        summary: 'Daily Standup',
        start: { dateTime: setMinutes(setHours(day, 9), 0).toISOString() },
        end: { dateTime: setMinutes(setHours(day, 9), 30).toISOString() },
      });

      eventsByCalendar['primary'].push({
        summary: 'Lunch',
        start: { dateTime: setMinutes(setHours(day, 12), 0).toISOString() },
        end: { dateTime: setMinutes(setHours(day, 13), 0).toISOString() },
      });
    }

    // Work calendar events
    if (eventsByCalendar['work']) {
      eventsByCalendar['work'].push({
        summary: 'Project Sync',
        start: { dateTime: setMinutes(setHours(day, 10), 0).toISOString() },
        end: { dateTime: setMinutes(setHours(day, 11), 0).toISOString() },
      });

      if (day.getDate() % 2 === 0) {
        eventsByCalendar['work'].push({
          summary: 'Sync Meeting',
          start: { dateTime: setMinutes(setHours(day, 14), 0).toISOString() },
          end: { dateTime: setMinutes(setHours(day, 15), 0).toISOString() },
        });
      }
    }

    // Personal calendar events
    if (eventsByCalendar['personal']) {
      eventsByCalendar['personal'].push({
        summary: 'Gym',
        start: { dateTime: setMinutes(setHours(day, 7), 0).toISOString() },
        end: { dateTime: setMinutes(setHours(day, 8), 0).toISOString() },
      });

      if (day.getDate() % 3 === 0) {
        eventsByCalendar['personal'].push({
          summary: 'Late Review',
          start: { dateTime: setMinutes(setHours(day, 20), 0).toISOString() },
          end: { dateTime: setMinutes(setHours(day, 21), 0).toISOString() },
        });
      }
    }
  });

  return eventsByCalendar;
}

export async function getCalendarList(accessToken: string) {
  if (accessToken === 'mock-token') {
    return [
      { id: 'primary', summary: 'Primary Calendar', backgroundColor: '#4285f4', primary: true, accessRole: 'owner' },
      { id: 'work', summary: 'Work', backgroundColor: '#0b8043', accessRole: 'owner' },
      { id: 'personal', summary: 'Personal', backgroundColor: '#d50000', accessRole: 'owner' },
      { id: 'birthdays', summary: 'Birthdays', backgroundColor: '#9e50a4', accessRole: 'reader' },
    ];
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    throw error;
  }
}

export async function getCalendarEvents(accessToken: string, calendarIds: string[], timeMin: string, timeMax: string) {
  if (accessToken === 'mock-token') {
    return generateMockEvents(calendarIds, timeMin, timeMax);
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    const eventsByCalendar: Record<string, any[]> = {};
    
    // Fetch events from all selected calendars in parallel
    const eventPromises = calendarIds.map(async (calendarId) => {
      const response = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return { calendarId, events: response.data.items || [] };
    });

    const results = await Promise.all(eventPromises);
    results.forEach(({ calendarId, events }) => {
      eventsByCalendar[calendarId] = events;
    });

    return eventsByCalendar;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

export interface CalendarOccupancy {
  id: string;
  summary: string;
  color: string;
  hours: number;
}

export interface DayOccupancy {
  date: string;
  calendars: CalendarOccupancy[];
  total: number;
}

export function calculateOccupancy(
  eventsByCalendar: Record<string, any[]>,
  calendarMetadata: Record<string, { summary: string; color: string }>,
  date: Date
): DayOccupancy {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const calendars: CalendarOccupancy[] = [];
  let dayTotalMinutes = 0;

  // Process each calendar's events
  for (const [calendarId, events] of Object.entries(eventsByCalendar)) {
    const meta = calendarMetadata[calendarId] || { summary: calendarId, color: '#3b82f6' };
    
    // 1. Collect all valid event intervals for this day for THIS calendar
    const intervals: { start: Date; end: Date }[] = [];

    events.forEach(event => {
      if (!event.start?.dateTime || !event.end?.dateTime) return;

      // Skip "Out of Office" events and "Free" (transparent) events
      if (
        event.eventType === 'outOfOffice' || 
        event.transparency === 'transparent' ||
        event.summary?.toLowerCase().includes('out of office') ||
        event.summary?.toLowerCase().includes('ooo') ||
        event.summary?.toLowerCase().includes('lunch')
      ) return;

      const start = parseISO(event.start.dateTime);
      const end = parseISO(event.end.dateTime);

      // Find intersection with the day
      const actualStart = new Date(Math.max(start.getTime(), dayStart.getTime()));
      const actualEnd = new Date(Math.min(end.getTime(), dayEnd.getTime()));

      if (actualStart < actualEnd) {
        intervals.push({ start: actualStart, end: actualEnd });
      }
    });

    if (intervals.length === 0) {
      calendars.push({
        id: calendarId,
        summary: meta.summary,
        color: meta.color,
        hours: 0
      });
      continue;
    }

    // 2. Merge overlapping intervals for THIS calendar
    intervals.sort((a, b) => a.start.getTime() - b.start.getTime());

    const mergedIntervals: { start: Date; end: Date }[] = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
      const current = intervals[i];
      const lastMerged = mergedIntervals[mergedIntervals.length - 1];

      if (current.start < lastMerged.end) {
        if (current.end > lastMerged.end) {
          lastMerged.end = current.end;
        }
      } else {
        mergedIntervals.push(current);
      }
    }

    // 3. Calculate total minutes for THIS calendar
    let calendarMinutes = 0;
    mergedIntervals.forEach(interval => {
      calendarMinutes += differenceInMinutes(interval.end, interval.start);
    });

    dayTotalMinutes += calendarMinutes;

    calendars.push({
      id: calendarId,
      summary: meta.summary,
      color: meta.color,
      hours: Number((calendarMinutes / 60).toFixed(1))
    });
  }

  return {
    date: date.toISOString(),
    calendars,
    total: Number((dayTotalMinutes / 60).toFixed(1))
  };
}

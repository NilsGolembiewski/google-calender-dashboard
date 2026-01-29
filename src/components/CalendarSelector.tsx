"use client";

import { useState, useEffect } from "react";
import { getCalendars } from "@/app/actions";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

interface Calendar {
  id: string;
  summary: string;
  backgroundColor?: string;
  accessRole?: string;
  primary?: boolean;
}

interface CalendarSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function CalendarSelector({ selectedIds, onSelectionChange }: CalendarSelectorProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMyCalendars, setShowMyCalendars] = useState(true);
  const [showOtherCalendars, setShowOtherCalendars] = useState(true);

  useEffect(() => {
    async function fetchCalendars() {
      try {
        const data = await getCalendars();
        const calendarList = data as Calendar[];
        setCalendars(calendarList);

        // Normalize 'primary' ID if it exists in selectedIds
        const primaryCalendar = calendarList.find(c => c.primary);
        if (primaryCalendar && selectedIds.includes('primary')) {
          onSelectionChange(selectedIds.map(id => id === 'primary' ? primaryCalendar.id : id));
        }
      } catch (error) {
        console.error("Failed to fetch calendars", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendars();
  }, []);

  const myCalendars = calendars.filter(c => c.accessRole === 'owner' || c.primary);
  const otherCalendars = calendars.filter(c => c.accessRole !== 'owner' && !c.primary);

  const toggleSelection = (id: string) => {
    const isPrimary = calendars.find(c => c.id === id)?.primary;
    if (selectedIds.includes(id) || (isPrimary && selectedIds.includes('primary'))) {
      onSelectionChange(selectedIds.filter(i => i !== id && i !== 'primary'));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderCalendarList = (list: Calendar[]) => (
    <ul className="mt-1 space-y-0.5">
      {list.map(calendar => {
        const isSelected = selectedIds.includes(calendar.id) || (calendar.primary && selectedIds.includes('primary'));
        return (
          <li key={calendar.id}>
            <button
              onClick={() => toggleSelection(calendar.id)}
              className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-left group"
            >
              <div 
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isSelected ? 'border-transparent' : 'border-gray-300'
                }`}
                style={{ backgroundColor: isSelected ? calendar.backgroundColor : 'transparent' }}
              >
                {isSelected && <Check className="w-3 h-3 text-white stroke-[3px]" />}
              </div>
              <span className={`text-sm truncate ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {calendar.summary}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* My Calendars */}
      <div>
        <button 
          onClick={() => setShowMyCalendars(!showMyCalendars)}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-1 px-2"
        >
          <span>My calendars</span>
          {showMyCalendars ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showMyCalendars && renderCalendarList(myCalendars)}
      </div>

      {/* Other Calendars */}
      {otherCalendars.length > 0 && (
        <div>
          <button 
            onClick={() => setShowOtherCalendars(!showOtherCalendars)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-1 px-2"
          >
            <span>Other calendars</span>
            {showOtherCalendars ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showOtherCalendars && renderCalendarList(otherCalendars)}
        </div>
      )}
    </div>
  );
}

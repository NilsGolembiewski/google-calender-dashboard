"use client";

import { useState, useEffect, useRef } from "react";
import { addMonths, startOfMonth, endOfMonth } from "date-fns";
import { MonthGrid } from "./MonthGrid";
import { getOccupancyData } from "@/app/actions";
import { DayOccupancy } from "@/lib/google-calendar";
import { useInView } from "react-intersection-observer";

interface InfiniteCalendarProps {
  selectedCalendarIds: string[];
}

export function InfiniteCalendar({ selectedCalendarIds }: InfiniteCalendarProps) {
  const [months, setMonths] = useState<Date[]>([
    startOfMonth(new Date()),
    addMonths(startOfMonth(new Date()), 1),
  ]);
  const [occupancyData, setOccupancyData] = useState<Record<string, DayOccupancy>>({});
  
  // Use a ref to track which months have been fetched for the CURRENT selection.
  // This avoids dependency loops and ensures we always have the latest state.
  const fetchedMonthsRef = useRef<Set<string>>(new Set());
  const lastSelectionRef = useRef<string>(JSON.stringify(selectedCalendarIds));

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '400px',
  });

  // When selection changes, clear data and reset the ref
  useEffect(() => {
    const currentSelection = JSON.stringify(selectedCalendarIds);
    if (currentSelection !== lastSelectionRef.current) {
      setOccupancyData({});
      fetchedMonthsRef.current = new Set();
      lastSelectionRef.current = currentSelection;
    }
  }, [selectedCalendarIds]);

  const loadMoreMonths = () => {
    setMonths(prev => {
      const lastMonth = prev[prev.length - 1];
      const nextMonth = addMonths(lastMonth, 1);
      return [...prev, nextMonth];
    });
  };

  useEffect(() => {
    if (inView) {
      loadMoreMonths();
    }
  }, [inView]);

  useEffect(() => {
    const fetchForNewMonths = async () => {
      const currentSelection = JSON.stringify(selectedCalendarIds);
      
      // Find months we haven't fetched data for yet in the current selection
      const monthsToFetch = months.filter(month => {
        const monthKey = startOfMonth(month).toISOString();
        return !fetchedMonthsRef.current.has(monthKey);
      });

      if (monthsToFetch.length === 0) return;

      // Mark as fetching
      monthsToFetch.forEach(m => fetchedMonthsRef.current.add(startOfMonth(m).toISOString()));

      for (const month of monthsToFetch) {
        const start = startOfMonth(month).toISOString();
        const end = endOfMonth(month).toISOString();
        
        try {
          const data = await getOccupancyData(start, end, selectedCalendarIds);
          
          // Only update if the selection hasn't changed while we were fetching
          if (JSON.stringify(selectedCalendarIds) === currentSelection) {
            setOccupancyData(prev => {
              const next = { ...prev };
              data.forEach(d => {
                next[d.date] = d;
              });
              return next;
            });
          }
        } catch (e) {
          console.error("Failed to fetch occupancy", e);
          // Allow retry on failure
          if (JSON.stringify(selectedCalendarIds) === currentSelection) {
            fetchedMonthsRef.current.delete(startOfMonth(month).toISOString());
          }
        }
      }
    };

    fetchForNewMonths();
  }, [months, selectedCalendarIds]);

  return (
    <div className="max-w-7xl mx-auto bg-white shadow-sm border-x">
      {months.map((month) => (
        <MonthGrid 
          key={month.toISOString()} 
          month={month} 
          occupancyData={occupancyData} 
        />
      ))}
      <div ref={ref} className="h-40 flex items-center justify-center bg-gray-50 border-t">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="text-sm text-gray-500">Loading next month...</span>
        </div>
      </div>
    </div>
  );
}

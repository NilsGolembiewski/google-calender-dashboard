"use client";

import { TodoistTask } from "@/lib/todoist-types";
import { format } from "date-fns";
import { X, CheckCircle2, Circle } from "lucide-react";
import { useState, useEffect } from "react";

interface TaskModalProps {
  date: Date;
  tasks: TodoistTask[];
  onClose: () => void;
  anchorRect?: DOMRect | null;
}

export function TaskModal({ date, tasks, onClose, anchorRect }: TaskModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Calculate position
  const top = anchorRect 
    ? Math.min(anchorRect.bottom + 8, window.innerHeight - 320) 
    : 0;
  const left = anchorRect 
    ? Math.min(anchorRect.left, window.innerWidth - 300) 
    : 0;

  const positionStyle: React.CSSProperties = anchorRect ? {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 100,
  } : {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
  };

  return (
    <>
      {/* Invisible backdrop to capture clicks outside */}
      <div 
        className="fixed inset-0 z-[99]" 
        onClick={onClose}
      />
      
      <div 
        style={positionStyle}
        className="bg-white rounded-lg shadow-xl w-72 overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-3 border-b bg-gray-50/50">
          <div>
            <h3 className="font-semibold text-xs text-gray-900">{format(date, "MMM d, yyyy")}</h3>
            <p className="text-[10px] text-gray-500">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
        
        <div className="max-h-64 overflow-y-auto p-2">
          {tasks.length > 0 ? (
            <ul className="space-y-1.5">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors">
                  <div className="mt-0.5">
                    {task.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate" title={task.summary}>
                      {task.summary}
                    </p>
                    {task.dueDate && (
                      <p className="text-[9px] text-gray-400">
                        {format(new Date(task.dueDate), "p")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">No tasks.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

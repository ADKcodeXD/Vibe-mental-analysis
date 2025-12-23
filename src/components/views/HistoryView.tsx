'use client';

import React from 'react';
import { ArrowLeft, Clock, Trash2 } from 'lucide-react';

interface HistoryItem {
  id: number;
  date: string;
  archetype: string;
  data: any;
}

interface HistoryViewProps {
  history: HistoryItem[];
  onSelect: (data: any) => void;
  onDelete: (id: number) => void;
  setView: (view: string) => void;
  ui: {
    result: {
      history_title: string;
      no_history: string;
      view_report: string;
    };
  };
}

/**
 * History view showing past analysis results
 */
export const HistoryView = ({ history, onSelect, onDelete, setView, ui }: HistoryViewProps) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <header className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setView('welcome')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
            aria-label="Back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-light text-gray-900 font-serif">{ui.result.history_title}</h1>
        </header>

        {history.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {ui.result.no_history}
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item: HistoryItem) => (
              <div 
                key={item.id}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition-all"
              >
                <div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Clock size={10} /> {item.date}
                  </div>
                  <div className="text-xl font-medium text-gray-800">{item.archetype}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onSelect(item)}
                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    {ui.result.view_report}
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

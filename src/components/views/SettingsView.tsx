'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Settings, Info, Send, CheckCircle2, XCircle, Brain } from 'lucide-react';
import { Input } from '../ui';
import clsx from 'clsx';

interface SettingsViewProps {
  config: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  setConfig: (config: any) => void;
  onSave: (newConfig: any) => void;
  onBack: () => void;
  ui: any;
}

export const SettingsView = ({ config, setConfig, onSave, onBack, ui }: SettingsViewProps) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; model?: string } | null>(null);
  
  // Use local state for the form to ensure changes are temporary until saved
  const [formConfig, setFormConfig] = useState(config);

  const models = [
    'google/gemini-3-flash-preview',
    'google/gemini-3-pro-preview',
    'openai/gpt-5.2-chat',
    'deepseek/deepseek-v3.2',
    'nex-agi/deepseek-v3.1-nex-n1:free',
    'x-ai/grok-4.1-fast',
    'anthropic/claude-haiku-4.5'
  ];

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: formConfig, test: true })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTestResult({ 
          success: true, 
          message: data.response || 'Success',
          model: data.model
        });
      } else {
        throw new Error(data.error || 'Connection failed');
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <header className="flex items-center justify-between mb-10 pt-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all text-sm font-bold uppercase tracking-widest group"
          >
            <div className="p-2 rounded-full border border-slate-200 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <ChevronLeft size={16} />
            </div>
            {ui.mode?.back || 'Back'}
          </button>
          
          <div className="flex items-center gap-3 text-slate-900">
             <Settings size={24} strokeWidth={1.5} />
             <h1 className="text-2xl font-serif font-bold">{ui.settings?.title || 'Settings'}</h1>
          </div>
          <div className="w-10" /> 
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 space-y-8"
        >
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex gap-3 items-start">
            <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              {ui.settings?.config_hint || "Configure your own LLM service. Settings are stored locally in your browser."}
            </p>
          </div>

          <div className="space-y-6">
            <Input 
              label={ui.settings?.apiKey || "API Key"} 
              value={formConfig.apiKey} 
              onChange={(v: string) => setFormConfig({ ...formConfig, apiKey: v })} 
              placeholder="sk-..." 
              type="password" 
            />
            <Input 
              label={ui.settings?.baseUrl || "Base URL"} 
              value={formConfig.baseUrl} 
              onChange={(v: string) => setFormConfig({ ...formConfig, baseUrl: v })} 
              placeholder="https://api.openai.com/v1" 
            />

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                {ui.settings?.model || "Model Name"}
              </label>
              
              <div className="flex flex-wrap gap-2">
                {models.map(m => (
                  <button
                    key={m}
                    onClick={() => setFormConfig({ ...formConfig, model: m })}
                    className={clsx(
                      "text-[10px] px-4 py-2 rounded-xl border transition-all font-bold tracking-tight",
                      formConfig.model === m 
                        ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                    )}
                  >
                    {m.split('/').pop() || m}
                  </button>
                ))}
              </div>

              <input
                value={formConfig.model}
                onChange={(e) => setFormConfig({ ...formConfig, model: e.target.value })}
                placeholder={ui.settings?.custom_model_placeholder || "Custom model name..."}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="pt-2">
               <button 
                 onClick={handleTest}
                 disabled={testing}
                 className={clsx(
                   "w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all",
                   testing 
                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
                 )}
               >
                 {testing ? (
                   <>
                     <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                     {ui.settings?.testing || "Testing..."}
                   </>
                 ) : (
                   <>
                     <Send size={16} />
                     {ui.settings?.test_btn || "Test LLM Connection"}
                   </>
                 )}
               </button>

               <AnimatePresence>
                 {testResult && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="mt-4 overflow-hidden"
                   >
                     <div className={clsx(
                       "p-4 rounded-2xl border flex flex-col gap-2",
                       testResult.success 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : "bg-rose-50 border-rose-100 text-rose-700"
                     )}>
                       <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                         {testResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                         {testResult.success ? (ui.settings?.test_success || "Connection Successful") : (ui.settings?.test_failed || "Connection Failed")}
                       </div>
                       
                       {testResult.success && testResult.model && (
                         <div className="flex items-center gap-2 text-[10px] opacity-80 font-mono">
                           <Brain size={10} /> {ui.settings?.test_response_code || "Response Code"}: OK | Model: {testResult.model}
                         </div>
                       )}

                       <p className="text-[11px] leading-relaxed font-medium">
                         {testResult.message}
                       </p>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50">
            <button 
              onClick={() => onSave(formConfig)}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl text-lg font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all active:translate-y-0"
            >
              {ui.settings?.save_close || "Save & Close"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

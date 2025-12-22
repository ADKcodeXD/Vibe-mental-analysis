'use client';

import React, { useState, useEffect } from 'react';

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

/**
 * Styled input component with label
 */
export const Input = ({ label, onChange, value, placeholder, type = 'text' }: InputProps) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</label>
    <input 
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-all" 
    />
  </div>
);

interface TextInputProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Textarea input component for longer text answers
 */
export const TextInput = ({ initialValue, onChange, placeholder }: TextInputProps) => {
  const [value, setValue] = useState(initialValue);
  
  // Sync if initialValue changes externally
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    onChange(newVal);
  };

  return (
    <textarea
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full bg-white/50 border-0 rounded-xl p-5 text-gray-800 placeholder-gray-400 focus:ring-0 focus:bg-white focus:shadow-lg transition-all h-40 resize-none text-lg leading-relaxed"
    />
  );
};

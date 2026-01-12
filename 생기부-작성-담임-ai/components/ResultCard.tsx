import React, { useState, useEffect } from 'react';
import { RecordSection } from '../types';

interface ResultCardProps {
  section: RecordSection;
  title: string;
  content: string;
  isGenerating: boolean;
  onContentChange: (newContent: string) => void;
  onRegenerate: () => void;
  targetLength: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ 
  section, 
  title, 
  content, 
  isGenerating, 
  onContentChange, 
  onRegenerate,
  targetLength 
}) => {
  const [localContent, setLocalContent] = useState(content);
  
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalContent(newVal);
    onContentChange(newVal);
  };

  const length = localContent.length;
  const isOverLength = length > targetLength * 1.2; // 20% margin warning

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 flex flex-col">
      <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center">
          {title}
          {isGenerating && (
             <span className="ml-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></span>
          )}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={onRegenerate}
            disabled={isGenerating}
            className="text-xs px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            재생성
          </button>
        </div>
      </div>
      
      <div className="p-0 relative flex-grow">
        <textarea
          value={localContent}
          onChange={handleChange}
          disabled={isGenerating}
          className="w-full h-64 p-6 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 leading-relaxed resize-none"
          placeholder={`${title} 내용이 여기에 생성됩니다.`}
        />
        <div className={`absolute bottom-4 right-6 text-sm font-mono ${isOverLength ? 'text-red-500' : 'text-gray-400'}`}>
          {length} / {targetLength}자
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
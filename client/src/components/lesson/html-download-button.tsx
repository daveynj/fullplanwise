import React from 'react';
import { Download } from 'lucide-react';

interface HtmlDownloadButtonProps {
  lessonId: number;
  title: string;
}

export function HtmlDownloadButton({ lessonId, title }: HtmlDownloadButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a 
        href={`/api/lessons/${lessonId}/pdf?format=html`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg transition-colors duration-200 border-2 border-white"
        style={{ animation: 'pulse 2s infinite' }}
      >
        <Download className="h-5 w-5" />
        <span>Download Vocabulary (HTML)</span>
      </a>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(22, 163, 74, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
          }
        }
      `}</style>
    </div>
  );
}
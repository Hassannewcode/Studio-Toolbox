
import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let formattedCode = code;
  if (language === 'json' && code) {
      try {
          formattedCode = JSON.stringify(JSON.parse(code), null, 2);
      } catch (e) {
          // It's not valid JSON, display as is.
      }
  }

  return (
    <div className="bg-background rounded-md border border-border-color relative group my-2 flex-grow flex-shrink min-h-0">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-surface text-on-surface-variant rounded-md hover:bg-border-color border border-border-color transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="p-4 text-sm text-on-surface overflow-auto h-full w-full">
        <code className={`language-${language} font-mono`}>{formattedCode}</code>
      </pre>
    </div>
  );
};

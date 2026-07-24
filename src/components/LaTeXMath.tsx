/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXMathProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export const LaTeXMath: React.FC<LaTeXMathProps> = ({ math, displayMode = false, className = '' }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && math) {
      try {
        katex.render(math, containerRef.current, {
          displayMode,
          throwOnError: false,
        });
      } catch (err) {
        if (containerRef.current) {
          containerRef.current.textContent = math;
        }
      }
    }
  }, [math, displayMode]);

  return <span ref={containerRef} className={`inline-block ${className}`} />;
};

/**
 * Parses inline $...$ or $$...$$ LaTeX math blocks in text automatically
 */
export const FormattedQuestionText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Split text by $$ or $
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);

  return (
    <span className="leading-relaxed">
      {parts.map((part, idx) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return <LaTeXMath key={idx} math={math} displayMode={true} className="my-2 block text-yellow-400" />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return <LaTeXMath key={idx} math={math} displayMode={false} className="text-yellow-400 font-mono px-1" />;
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
};

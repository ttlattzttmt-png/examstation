/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface WatermarkOverlayProps {
  text: string;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ text }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none opacity-15">
      <div className="grid h-full w-full grid-cols-2 gap-12 p-8 md:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center -rotate-25 transform text-center text-xs font-mono font-bold tracking-widest text-yellow-300 uppercase"
          >
            {text || 'البشمهندس EXAM GUARD • SECURE LAN'}
          </div>
        ))}
      </div>
    </div>
  );
};

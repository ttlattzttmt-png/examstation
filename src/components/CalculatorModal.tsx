/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calculator as CalcIcon, X } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleNum = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOp = (op: string) => {
    setDisplay(display + ' ' + op + ' ');
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleCalculate = () => {
    try {
      // Safe sanitized eval for math expression
      const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/').replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      setDisplay(String(result));
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleSqrt = () => {
    try {
      const val = parseFloat(display);
      setDisplay(String(Math.sqrt(val)));
    } catch (_) {
      setDisplay('Error');
    }
  };

  const handleSquare = () => {
    try {
      const val = parseFloat(display);
      setDisplay(String(val * val));
    } catch (_) {
      setDisplay('Error');
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 w-80 rounded-2xl border border-yellow-500/30 bg-[#181818] p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2 font-bold text-yellow-400">
          <CalcIcon size={18} /> الحاسبة العلمية الذكية
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="mb-4 rounded-xl bg-[#0D0D0D] p-3 text-right font-mono text-2xl font-bold text-yellow-300 overflow-x-auto border border-gray-800">
        {display}
      </div>

      <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
        <button onClick={handleClear} className="col-span-2 rounded-lg bg-red-950/60 p-2.5 text-red-300 hover:bg-red-900 border border-red-800/40">
          C
        </button>
        <button onClick={handleSqrt} className="rounded-lg bg-gray-800 p-2.5 text-yellow-400 hover:bg-gray-700">
          √x
        </button>
        <button onClick={() => handleOp('÷')} className="rounded-lg bg-yellow-500/20 p-2.5 text-yellow-400 hover:bg-yellow-500/30">
          ÷
        </button>

        <button onClick={() => handleNum('7')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          7
        </button>
        <button onClick={() => handleNum('8')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          8
        </button>
        <button onClick={() => handleNum('9')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          9
        </button>
        <button onClick={() => handleOp('×')} className="rounded-lg bg-yellow-500/20 p-2.5 text-yellow-400 hover:bg-yellow-500/30">
          ×
        </button>

        <button onClick={() => handleNum('4')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          4
        </button>
        <button onClick={() => handleNum('5')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          5
        </button>
        <button onClick={() => handleNum('6')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          6
        </button>
        <button onClick={() => handleOp('-')} className="rounded-lg bg-yellow-500/20 p-2.5 text-yellow-400 hover:bg-yellow-500/30">
          -
        </button>

        <button onClick={() => handleNum('1')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          1
        </button>
        <button onClick={() => handleNum('2')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          2
        </button>
        <button onClick={() => handleNum('3')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          3
        </button>
        <button onClick={() => handleOp('+')} className="rounded-lg bg-yellow-500/20 p-2.5 text-yellow-400 hover:bg-yellow-500/30">
          +
        </button>

        <button onClick={() => handleNum('0')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          0
        </button>
        <button onClick={() => handleNum('.')} className="rounded-lg bg-gray-900 p-2.5 text-gray-200 hover:bg-gray-800">
          .
        </button>
        <button onClick={handleSquare} className="rounded-lg bg-gray-800 p-2.5 text-yellow-400 hover:bg-gray-700">
          x²
        </button>
        <button onClick={handleCalculate} className="rounded-lg bg-[#FFD600] p-2.5 text-black font-bold hover:bg-yellow-300">
          =
        </button>
      </div>
    </div>
  );
};

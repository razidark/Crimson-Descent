import React from 'react';
import { motion } from 'framer-motion';
import { X, Square, Minus, ShieldAlert } from 'lucide-react';
import { WindowState } from '../types/game';

import { useDragControls } from 'framer-motion';

interface WindowProps {
  appKey: string;
  title: string;
  icon: string;
  windowState: WindowState;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  isFocused: boolean;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({
  appKey,
  title,
  icon,
  windowState,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  isFocused,
  children
}) => {
  const dragControls = useDragControls();

  if (!windowState.isOpen) return null;

  const { isMaximized, x, y, width, height, zIndex } = windowState;

  // Maximize overrides width/height and positions at 0, 0
  const style: React.CSSProperties = isMaximized
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh - var(--taskbar-height))',
        zIndex,
      }
    : {
        position: 'absolute',
        left: x,
        top: y,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
      };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={(_e, info) => {
        onMove(x + info.offset.x, y + info.offset.y);
      }}
      style={style}
      onMouseDown={onFocus}
      className={`glass-panel flex flex-col overflow-hidden ${
        isFocused ? 'glass-panel-focused' : ''
      }`}
    >
      {/* Title Bar - Drag Handle */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-red-950 bg-black/40 cursor-move select-none title-bar-drag"
        onDoubleClick={onMaximize}
        onPointerDown={(e) => dragControls.start(e)}
        style={{ touchAction: 'none' }}
      >

        <div className="flex items-center gap-2">
          <span className="text-base filter drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]">{icon}</span>
          <span className="text-xs font-semibold gothic-title text-slate-100 tracking-wider flex items-center gap-1.5">
            {title}
            {appKey === 'drac_console' && <span className="px-1 py-0.5 rounded text-[8px] bg-red-950/80 text-red-400 border border-red-900/60 font-mono flex items-center gap-0.5"><ShieldAlert size={8} /> root</span>}
          </span>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition"
          >
            <Square size={10} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950/30 flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterAvatar } from './CharacterAvatar';
import { CharacterId } from '../types';

interface ReactionMessageProps {
  message: string | null;
  speakerCharacterId?: CharacterId;
  speakerName?: string;
  type?: 'quote' | 'event' | 'cut' | 'six';
}

export const ReactionMessage: React.FC<ReactionMessageProps> = ({
  message,
  speakerCharacterId,
  speakerName,
  type = 'event',
}) => {
  return (
    <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-3 pointer-events-none flex justify-center">
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`px-3.5 py-1.5 rounded-full flex items-center justify-center gap-2 shadow-2xl border backdrop-blur-md ${
              type === 'cut'
                ? 'bg-rose-950/95 text-rose-100 border-rose-500/60 shadow-rose-900/40'
                : type === 'six'
                ? 'bg-amber-950/95 text-amber-100 border-amber-500/60 shadow-amber-900/40'
                : 'bg-neutral-900/95 text-neutral-100 border-white/25 shadow-black/60'
            }`}
          >
            {speakerCharacterId && (
              <CharacterAvatar id={speakerCharacterId} size="xs" className="w-5 h-5" />
            )}

            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold truncate">
              {speakerName && (
                <span className="text-amber-300 font-extrabold hidden sm:inline">
                  {speakerName}:
                </span>
              )}
              <span className="truncate">{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


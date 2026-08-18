import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle } from 'lucide-react';
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
    <div className="h-10 sm:h-12 w-full flex items-center justify-center px-2">
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`max-w-md w-full px-3 py-1.5 rounded-full flex items-center justify-center gap-2 shadow-lg border backdrop-blur-md ${
              type === 'cut'
                ? 'bg-rose-900/90 text-rose-100 border-rose-500/50'
                : type === 'six'
                ? 'bg-amber-900/90 text-amber-100 border-amber-500/50'
                : 'bg-neutral-900/90 text-neutral-100 border-white/20'
            }`}
          >
            {speakerCharacterId && (
              <CharacterAvatar id={speakerCharacterId} size="xs" />
            )}
            
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold truncate">
              {speakerName && (
                <span className="text-amber-300 font-bold hidden sm:inline">
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

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, X, Bell, ShieldAlert, Trophy, Users, Globe } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ComingSoonModalProps {
  isOpen: boolean;
  featureTitle: string;
  featureDescription?: string;
  featureIcon?: 'globe' | 'users' | 'trophy' | 'sparkles';
  onClose: () => void;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  featureTitle,
  featureDescription,
  featureIcon = 'sparkles',
  onClose,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (featureIcon) {
      case 'globe':
        return <Globe className="w-8 h-8 text-sky-400" />;
      case 'users':
        return <Users className="w-8 h-8 text-purple-400" />;
      case 'trophy':
        return <Trophy className="w-8 h-8 text-amber-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-neutral-900 border border-white/20 rounded-3xl p-6 text-white shadow-2xl text-center relative overflow-hidden"
      >
        {/* Ambient background glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playButton();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center mb-3 shadow-inner">
          {getIcon()}
        </div>

        {/* Tag */}
        <span className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-widest mb-2">
          Under Development
        </span>

        {/* Title */}
        <h3 className="text-xl font-black text-white tracking-tight mb-2">
          {featureTitle}
        </h3>

        {/* Description */}
        <p className="text-xs text-neutral-300 leading-relaxed mb-6">
          {featureDescription ||
            'We are fine-tuning this game mode to bring you real-time online matchmaking, leaderboards, and seasonal rewards. Stay tuned!'}
        </p>

        {/* Action Button */}
        <button
          onClick={() => {
            sounds.playButton();
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Bell className="w-4 h-4" /> NOTIFY ME WHEN READY
        </button>
      </motion.div>
    </div>
  );
};

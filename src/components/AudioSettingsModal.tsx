import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Music, X, Sliders } from 'lucide-react';
import { sounds } from '../utils/audio';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [musicMuted, setMusicMuted] = useState<boolean>(sounds.isMusicMuted());
  const [sfxMuted, setSfxMuted] = useState<boolean>(sounds.isSfxMuted());
  const [musicVolume, setMusicVolume] = useState<number>(sounds.getMusicVolume());
  const [sfxVolume, setSfxVolume] = useState<number>(sounds.getSfxVolume());

  useEffect(() => {
    if (isOpen) {
      setMusicMuted(sounds.isMusicMuted());
      setSfxMuted(sounds.isSfxMuted());
      setMusicVolume(sounds.getMusicVolume());
      setSfxVolume(sounds.getSfxVolume());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMusic = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    sounds.setMusicMuted(next);
    sounds.playButton();
  };

  const handleToggleSfx = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    sounds.setSfxMuted(next);
    sounds.playButton();
  };

  const handleMusicVolChange = (val: number) => {
    setMusicVolume(val);
    sounds.setMusicVolume(val);
    if (musicMuted && val > 0) {
      setMusicMuted(false);
      sounds.setMusicMuted(false);
    }
  };

  const handleSfxVolChange = (val: number) => {
    setSfxVolume(val);
    sounds.setSfxVolume(val);
    if (sfxMuted && val > 0) {
      setSfxMuted(false);
      sounds.setSfxMuted(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-amber-400 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-xs bg-neutral-900 border border-neutral-700 rounded-3xl p-5 text-white shadow-2xl relative select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-amber-300">
            <Sliders className="w-4 h-4" /> Audio Settings
          </div>
          <button
            onClick={() => {
              sounds.playButton();
              onClose();
            }}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Music Setting */}
        <div className="bg-neutral-800/80 border border-white/5 rounded-2xl p-3.5 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Music className={`w-4 h-4 ${musicMuted ? 'text-neutral-500' : 'text-amber-400'}`} />
              <span className="text-xs font-bold">Background Music</span>
            </div>
            <button
              onClick={handleToggleMusic}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                !musicMuted
                  ? 'bg-amber-400 text-neutral-950 shadow-xs'
                  : 'bg-neutral-700 text-neutral-400'
              }`}
            >
              {!musicMuted ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold text-neutral-400 w-8">
              {musicMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicMuted ? 0 : musicVolume}
              onChange={(e) => handleMusicVolChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        {/* SFX Setting */}
        <div className="bg-neutral-800/80 border border-white/5 rounded-2xl p-3.5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {sfxMuted ? (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs font-bold">Sound Effects (SFX)</span>
            </div>
            <button
              onClick={handleToggleSfx}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                !sfxMuted
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-neutral-700 text-neutral-400'
              }`}
            >
              {!sfxMuted ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold text-neutral-400 w-8">
              {sfxMuted ? '0%' : `${Math.round(sfxVolume * 100)}%`}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxMuted ? 0 : sfxVolume}
              onChange={(e) => handleSfxVolChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={() => {
            sounds.playButton();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
};

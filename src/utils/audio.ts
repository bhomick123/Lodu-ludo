// Centralized Web Audio API sound synthesizer and continuous original background music engine
// Zero external network dependencies, royalty-free, mobile-friendly with haptic feedback.

interface AudioPreferences {
  musicMuted: boolean;
  sfxMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
}

const STORAGE_KEY = 'lodu_ludo_audio_preferences_v2';

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicMuted: boolean = false;
  private sfxMuted: boolean = false;
  private musicVolume: number = 0.20; // 20% volume for pleasant subtle background
  private sfxVolume: number = 0.65;   // 65% volume for crisp, clear SFX
  
  // Background music scheduler nodes
  private musicGainNode: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicTimer: NodeJS.Timeout | null = null;
  private musicStep: number = 0;

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: AudioPreferences = JSON.parse(saved);
        this.musicMuted = Boolean(parsed.musicMuted);
        this.sfxMuted = Boolean(parsed.sfxMuted);
        if (typeof parsed.musicVolume === 'number') this.musicVolume = parsed.musicVolume;
        if (typeof parsed.sfxVolume === 'number') this.sfxVolume = parsed.sfxVolume;
      }
    } catch {
      // Ignore local storage read errors
    }
  }

  private savePreferences() {
    if (typeof window === 'undefined') return;
    try {
      const prefs: AudioPreferences = {
        musicMuted: this.musicMuted,
        sfxMuted: this.sfxMuted,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore local storage write errors
    }
  }

  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // --- HAPTIC FEEDBACK ---
  public vibrate(pattern: number | number[] = 15) {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore haptics failure
      }
    }
  }

  // --- SETTINGS CONTROLS ---
  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    this.savePreferences();
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(
        muted ? 0 : this.musicVolume,
        this.ctx.currentTime
      );
    }
    if (!muted && !this.isMusicPlaying) {
      this.startMusic();
    }
  }

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
    this.savePreferences();
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
    if (this.musicGainNode && this.ctx && !this.musicMuted) {
      this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
  }

  public isMusicMuted(): boolean {
    return this.musicMuted;
  }

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public toggleMute(): boolean {
    const next = !this.musicMuted;
    this.setMusicMuted(next);
    this.setSfxMuted(next);
    return next;
  }

  public getMuted(): boolean {
    return this.musicMuted && this.sfxMuted;
  }

  // --- CONTINUOUS ORIGINAL BACKGROUND MUSIC SYNTHESIZER ---
  // Original, rhythmic, playful Indian board-game ambient loop using Web Audio nodes.
  public startMusic() {
    if (this.isMusicPlaying) return;
    const ctx = this.initContext();
    if (!ctx) return;

    if (!this.musicGainNode) {
      this.musicGainNode = ctx.createGain();
      this.musicGainNode.connect(ctx.destination);
    }

    this.musicGainNode.gain.setValueAtTime(
      this.musicMuted ? 0 : this.musicVolume,
      ctx.currentTime
    );

    this.isMusicPlaying = true;
    this.musicStep = 0;
    this.scheduleMusicBeat();
  }

  private scheduleMusicBeat() {
    if (!this.isMusicPlaying || !this.ctx || !this.musicGainNode) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const step = this.musicStep % 16;
    const masterGain = this.musicGainNode;

    // 1. Percussive Rhythmic Pulse (Dholak/Bayan inspired bass & rim ticks)
    if (step === 0 || step === 8 || step === 10) {
      // Low bass drum thud
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(110, now);
      bassOsc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
      bassGain.gain.setValueAtTime(0.22, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.14);
    }

    if (step % 2 === 1 || step === 4 || step === 12) {
      // Crisp high rim tap / shaker
      const rimOsc = ctx.createOscillator();
      const rimGain = ctx.createGain();
      rimOsc.type = 'triangle';
      rimOsc.frequency.setValueAtTime(480 + (step % 4) * 40, now);
      rimOsc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      rimGain.gain.setValueAtTime(0.08, now);
      rimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      rimOsc.connect(rimGain);
      rimGain.connect(masterGain);
      rimOsc.start(now);
      rimOsc.stop(now + 0.04);
    }

    // 2. Playful Pentatonic Melodic Pluck (Sitar/Bansuri inspired mode: C4, D4, E4, G4, A4, C5)
    // 16-step melody pattern
    const melodyNotes: (number | null)[] = [
      261.63, null, 329.63, 392.00,
      null,   440.00, 392.00, null,
      523.25, null, 440.00, 392.00,
      329.63, null, 293.66, 261.63,
    ];

    const noteFreq = melodyNotes[step];
    if (noteFreq) {
      const melOsc = ctx.createOscillator();
      const melGain = ctx.createGain();
      melOsc.type = 'sine';
      melOsc.frequency.setValueAtTime(noteFreq, now);

      // Subtle warm pitch slide
      melOsc.frequency.exponentialRampToValueAtTime(noteFreq * 1.01, now + 0.02);
      melOsc.frequency.exponentialRampToValueAtTime(noteFreq, now + 0.18);

      melGain.gain.setValueAtTime(0.12, now);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      melOsc.connect(melGain);
      melGain.connect(masterGain);
      melOsc.start(now);
      melOsc.stop(now + 0.22);
    }

    // 3. Subtle Warm Ambient Pad Drone (C3 / G3 / C4 chords on step 0 and step 8)
    if (step === 0 || step === 8) {
      const droneFreq = step === 0 ? 130.81 : 196.00; // C3 or G3
      const droneOsc = ctx.createOscillator();
      const droneGain = ctx.createGain();
      droneOsc.type = 'triangle';
      droneOsc.frequency.setValueAtTime(droneFreq, now);
      droneGain.gain.setValueAtTime(0.05, now);
      droneGain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      droneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      droneOsc.connect(droneGain);
      droneGain.connect(masterGain);
      droneOsc.start(now);
      droneOsc.stop(now + 0.95);
    }

    this.musicStep++;
    // 125ms per 16th note = 120 BPM tempo
    this.musicTimer = setTimeout(() => {
      this.scheduleMusicBeat();
    }, 125);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // --- SOUND EFFECTS (SFX) ---

  // 1. Rolling Dice shaker
  public playDiceRoll() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate([15, 12, 18]);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.05 + Math.random() * 0.02;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180 + Math.random() * 240, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.035);

      const vol = (0.22 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.035);
    }
  }

  // 2. Dice Landing with a solid wooden thud
  public playDiceLand() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate(18);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    const vol = 0.3 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 3. Token selection pop
  public playTokenSelect() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate(12);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    const vol = 0.22 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 4. Token single step hop sound
  public playTokenStep() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate(8);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.055);

    const vol = 0.2 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.065);
  }

  // 5. Token release from base (Six rolled!)
  public playTokenRelease() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate([20, 15, 25]);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A Major
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + idx * 0.055;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const vol = 0.18 * this.sfxVolume;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  // 6. Token entering home lane (Steps 52-56)
  public playHomeLaneEntry() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate([15, 10, 20]);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880]; // D Major bright chime
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const vol = 0.2 * this.sfxVolume;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  // 7. Reaching final home (Step 57)
  public playHomeArrival() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate([25, 20, 35]);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C major fanfare
    chords.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + i * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const vol = 0.25 * this.sfxVolume;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  // 8. Cut / Capture opponent token
  public playTokenCut() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate([35, 20, 50]);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Whoosh snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(720, now);
    snapOsc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    snapGain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.09);

    // Punchy sub-bass impact
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(240, now + 0.02);
    bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    bassGain.gain.setValueAtTime(0.45 * this.sfxVolume, now + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    bassOsc.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bassOsc.start(now + 0.02);
    bassOsc.stop(now + 0.3);
  }

  // 9. Turn Change notification whoosh
  public playTurnChange() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(630, now + 0.06);

    const vol = 0.12 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 10. Invalid token interaction
  public playInvalidToken() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate(25);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.06);

    const vol = 0.15 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 11. Grand Victory Fanfare
  public playWinFanfare() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate([50, 40, 50, 40, 100]);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.14 },
      { f: 659.25, d: 0.14 },
      { f: 783.99, d: 0.14 },
      { f: 1046.5, d: 0.38 },
      { f: 880.0, d: 0.18 },
      { f: 1046.5, d: 0.55 },
    ];

    let offset = 0;
    melody.forEach((item) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + offset;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, t);

      const vol = 0.28 * this.sfxVolume;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + item.d);

      offset += item.d * 0.82;
    });
  }

  // 12. Tactile Button Click
  public playButton() {
    if (this.sfxMuted) return;
    this.initContext();
    this.vibrate(10);
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

    const vol = 0.15 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const sounds = new AudioManager();

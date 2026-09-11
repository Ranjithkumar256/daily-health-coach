/**
 * Daily Health Coach - Sound & Android Haptic Feedback Engine
 * Synthesizes pure tones via Web Audio API and triggers Android haptic vibrations.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('sound_enabled', this.soundEnabled);
    if (this.soundEnabled) {
      this.playChime('pop');
    }
    return this.soundEnabled;
  }

  /**
   * Triggers Android device vibration if supported.
   */
  vibrate(pattern = [25]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore vibration errors on restricted browsers
      }
    }
  }

  playChime(type = 'water') {
    this.vibrate(type === 'achievement' ? [40, 60, 80] : [25]);

    if (!this.soundEnabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'water') {
        // Pleasant liquid droplet glissando
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'habit') {
        // High crisp double-tone for completion
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (type === 'achievement') {
        // Triumphant chord progression
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const chordOsc = this.audioCtx.createOscillator();
          const chordGain = this.audioCtx.createGain();
          chordOsc.type = 'sine';
          chordOsc.frequency.setValueAtTime(freq, now + (i * 0.06));
          chordGain.gain.setValueAtTime(0.18, now + (i * 0.06));
          chordGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
          chordOsc.connect(chordGain);
          chordGain.connect(this.audioCtx.destination);
          chordOsc.start(now + (i * 0.06));
          chordOsc.stop(now + 0.48);
        });
      } else {
        // Pop click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.07);
      }
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }
}

window.soundEngine = new SoundEngine();

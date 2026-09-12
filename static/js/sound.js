// Bulletproof Web Audio API Sound Synthesizer for Life RPG (Safari & Chrome Compatible)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false; // Always default to unmuted
    localStorage.removeItem('life_rpg_muted');
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Web Audio init error:', e);
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (!this.muted) {
      this.init();
      this.playCoinSound();
    }
    return this.muted;
  }

  playTone(freq, type = 'square', duration = 0.15, delay = 0, volume = 0.45) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      const startTime = this.ctx.currentTime + delay;
      
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  playQuestComplete() {
    // Crisp, vibrant rising 8-bit arpeggio (C5 -> E5 -> G5 -> C6)
    this.playTone(523.25, 'triangle', 0.12, 0.0, 0.45);
    this.playTone(659.25, 'triangle', 0.12, 0.08, 0.45);
    this.playTone(783.99, 'triangle', 0.15, 0.16, 0.5);
    this.playTone(1046.50, 'sine', 0.28, 0.24, 0.55);
  }

  playCoinSound() {
    // Classic 2-tone coin pickup (B5 -> E6)
    this.playTone(987.77, 'sine', 0.09, 0.0, 0.45);
    this.playTone(1318.51, 'sine', 0.22, 0.07, 0.5);
  }

  playLevelUp() {
    // Epic 6-tone level-up fanfare
    const notes = [440, 554.37, 659.25, 880, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sawtooth', 0.22, idx * 0.09, 0.4);
    });
  }

  playBossHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, startTime);
      osc.frequency.exponentialRampToValueAtTime(30, startTime + 0.18);

      gain.gain.setValueAtTime(0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    } catch (e) {}
  }

  playEquip() {
    this.playTone(450, 'sine', 0.08, 0.0, 0.4);
    this.playTone(850, 'triangle', 0.12, 0.05, 0.45);
  }

  playPotion() {
    const notes = [320, 480, 640, 800, 960];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.1, idx * 0.05, 0.35);
    });
  }

  playError() {
    this.playTone(180, 'sawtooth', 0.15, 0.0, 0.4);
    this.playTone(140, 'sawtooth', 0.22, 0.12, 0.4);
  }
}

const soundManager = new SoundManager();

// Automatically unlock Web Audio on first user interaction for Safari
window.addEventListener('click', () => {
  soundManager.init();
}, { once: false });

window.addEventListener('keydown', () => {
  soundManager.init();
}, { once: false });

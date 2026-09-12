// 8-Bit Web Audio API Sound Synthesizer for Life RPG
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('life_rpg_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('life_rpg_muted', this.muted);
    return this.muted;
  }

  playTone(freq, type = 'square', duration = 0.1, delay = 0, volume = 0.15) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    setTimeout(() => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio play failed:', e);
      }
    }, delay * 1000);
  }

  playQuestComplete() {
    // Upbeat rising arpeggio (C5 -> E5 -> G5 -> C6)
    this.playTone(523.25, 'triangle', 0.12, 0.0, 0.2);
    this.playTone(659.25, 'triangle', 0.12, 0.08, 0.2);
    this.playTone(783.99, 'triangle', 0.15, 0.16, 0.22);
    this.playTone(1046.50, 'sine', 0.25, 0.24, 0.25);
  }

  playCoinSound() {
    // Classic 2-tone coin (B5 -> E6)
    this.playTone(987.77, 'sine', 0.08, 0.0, 0.18);
    this.playTone(1318.51, 'sine', 0.22, 0.07, 0.2);
  }

  playLevelUp() {
    // Epic 6-tone level-up fanfare
    const notes = [440, 554.37, 659.25, 880, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sawtooth', 0.2, idx * 0.1, 0.15);
    });
  }

  playBossHit() {
    // Crunchy impact hit
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  playEquip() {
    // Crisp click / swish
    this.playTone(400, 'sine', 0.05, 0.0, 0.15);
    this.playTone(800, 'triangle', 0.08, 0.04, 0.15);
  }

  playPotion() {
    // Magical bubbly heal sound
    const notes = [300, 450, 600, 750, 900];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.1, idx * 0.05, 0.12);
    });
  }

  playError() {
    // Low warning buzz
    this.playTone(150, 'sawtooth', 0.15, 0.0, 0.2);
    this.playTone(130, 'sawtooth', 0.2, 0.12, 0.2);
  }
}

const soundManager = new SoundManager();

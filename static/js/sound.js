// 8-Bit Web Audio API Sound Synthesizer for Life RPG (Safari & Chrome Compatible)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('life_rpg_muted') === 'true';
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
    localStorage.setItem('life_rpg_muted', this.muted);
    return this.muted;
  }

  playTone(freq, type = 'square', duration = 0.15, delay = 0, volume = 0.35) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

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
    // Crisp, vibrant rising 8-bit arpeggio (C5 -> E5 -> G5 -> C6)
    this.playTone(523.25, 'triangle', 0.14, 0.0, 0.35);
    this.playTone(659.25, 'triangle', 0.14, 0.09, 0.35);
    this.playTone(783.99, 'triangle', 0.16, 0.18, 0.38);
    this.playTone(1046.50, 'sine', 0.3, 0.27, 0.4);
  }

  playCoinSound() {
    // Classic 2-tone coin pickup (B5 -> E6)
    this.playTone(987.77, 'sine', 0.1, 0.0, 0.35);
    this.playTone(1318.51, 'sine', 0.25, 0.08, 0.4);
  }

  playLevelUp() {
    // Epic 6-tone level-up fanfare
    const notes = [440, 554.37, 659.25, 880, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sawtooth', 0.25, idx * 0.1, 0.3);
    });
  }

  playBossHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playEquip() {
    this.playTone(450, 'sine', 0.08, 0.0, 0.3);
    this.playTone(850, 'triangle', 0.12, 0.05, 0.3);
  }

  playPotion() {
    const notes = [320, 480, 640, 800, 960];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.12, idx * 0.06, 0.25);
    });
  }

  playError() {
    this.playTone(180, 'sawtooth', 0.18, 0.0, 0.3);
    this.playTone(140, 'sawtooth', 0.25, 0.14, 0.3);
  }
}

const soundManager = new SoundManager();

// Automatically unlock Web Audio on first user interaction for Safari/Chrome autoplay policy
document.addEventListener('click', () => {
  soundManager.init();
}, { once: false });

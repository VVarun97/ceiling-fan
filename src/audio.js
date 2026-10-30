/**
 * AURA Procedural Breeze & Airflow Audio Synthesizer
 * Uses Web Audio API to create a gentle, realistic whoosh of circulating air
 * that organically responds to fan speed without any external audio files.
 */
class BreezeAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.isPlaying = false;
    this.noiseNode = null;
    this.filterNode = null;
    this.gainNode = null;
    this.lfoNode = null;
    this.lfoGain = null;
    this.currentSpeed = 2; // 0 to 5
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    // 1. Generate 5 seconds of pink noise buffer
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    // 2. Audio Nodes
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // Filter to shape into low, soft wind
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 220;
    this.filterNode.Q.value = 1.2;

    // Master volume gain
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0; // Starts silent

    // LFO to simulate subtle rhythmic blade passing
    this.lfoNode = this.ctx.createOscillator();
    this.lfoNode.type = 'sine';
    this.lfoNode.frequency.value = 2.0; // 2 Hz blade cadence

    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.value = 40; // Frequency modulation depth

    this.lfoNode.connect(this.filterNode.frequency);
    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.noiseNode.start(0);
    this.lfoNode.start(0);
    this.isPlaying = true;
  }

  toggleSound() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    this.updateAudioParameters();
    return !this.isMuted;
  }

  setSpeed(speedLevel) {
    this.currentSpeed = Math.max(0, Math.min(5, speedLevel));
    if (!this.isMuted && this.ctx) {
      this.updateAudioParameters();
    }
  }

  updateAudioParameters() {
    if (!this.gainNode || !this.filterNode || !this.lfoNode) return;

    if (this.isMuted || this.currentSpeed === 0) {
      // Fade out smoothly
      const now = this.ctx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setTargetAtTime(0, now, 0.15);
      return;
    }

    const now = this.ctx.currentTime;
    // Speed maps:
    // Speed 1: gain ~ 0.12, cutoff ~ 160Hz, LFO ~ 1.5Hz
    // Speed 5: gain ~ 0.45, cutoff ~ 420Hz, LFO ~ 6.5Hz
    const normalized = this.currentSpeed / 5;
    const targetGain = 0.08 + normalized * 0.35;
    const targetFreq = 140 + normalized * 320;
    const targetLfo = 1.2 + normalized * 5.5;

    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.25);

    this.filterNode.frequency.cancelScheduledValues(now);
    this.filterNode.frequency.setTargetAtTime(targetFreq, now, 0.3);

    this.lfoNode.frequency.cancelScheduledValues(now);
    this.lfoNode.frequency.setTargetAtTime(targetLfo, now, 0.2);
  }
}

export const audioEngine = new BreezeAudioEngine();

/**
 * Pure Web Audio API Astronomical Radio Signal Synthesizer.
 * Generates an authentic deep-space radio telescope receiver atmosphere:
 * - Filtered cosmic background static (Johnson-Nyquist / CMB noise)
 * - Narrowband 1420.405 MHz scaled carrier tone with subtle Doppler drift
 * - Completely muted by default, highly restrained.
 */

class ObservatoryAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private carrierOsc: OscillatorNode | null = null;
  private carrierGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning = false;

  private init() {
    if (this.ctx) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Cosmic Background Static (filtered white noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // Bandpass filter to mimic receiver channelization (around 400Hz - 1200Hz audible equivalent)
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(650, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.noiseNode.connect(bandpass);
    bandpass.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    // 2. Narrowband Hydrogen Line Harmonic Carrier (scaled to 880 Hz audible pitch)
    this.carrierOsc = this.ctx.createOscillator();
    this.carrierOsc.type = 'sine';
    this.carrierOsc.frequency.setValueAtTime(880, this.ctx.currentTime);

    this.carrierGain = this.ctx.createGain();
    this.carrierGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.carrierOsc.connect(this.carrierGain);
    this.carrierGain.connect(this.masterGain);

    this.noiseNode.start();
    this.carrierOsc.start();
  }

  public toggle(): boolean {
    if (!this.ctx) {
      this.init();
    }

    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }

    this.isRunning = !this.isRunning;

    if (this.masterGain && this.ctx) {
      const targetGain = this.isRunning ? 0.07 : 0.0;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }

    return this.isRunning;
  }

  public updateNarrativeProgress(p: number) {
    if (!this.carrierGain || !this.noiseGain || !this.carrierOsc || !this.ctx || !this.isRunning)
      return;
    const now = this.ctx.currentTime;
    const clampedP = Math.max(0, Math.min(1, p));

    if (clampedP < 0.12) {
      // Scene 1: Silence / Emergence - very quiet cosmic noise, subtle carrier emergence
      const emergence = Math.max(0, (clampedP - 0.04) / 0.08);
      this.noiseGain.gain.setTargetAtTime(0.015, now, 0.1);
      this.carrierGain.gain.setTargetAtTime(emergence * 0.012, now, 0.1);
      this.carrierOsc.frequency.setTargetAtTime(880, now, 0.1);
    } else if (clampedP < 0.28) {
      // Scene 2: Known - established harmonic tone alongside ambient background
      this.noiseGain.gain.setTargetAtTime(0.02, now, 0.1);
      this.carrierGain.gain.setTargetAtTime(0.024, now, 0.1);
      this.carrierOsc.frequency.setTargetAtTime(880, now, 0.1);
    } else if (clampedP < 0.45) {
      // Scene 3: Overwhelm - spectral congestion with elevated noise floor
      const overwhelmProg = (clampedP - 0.28) / 0.17;
      this.noiseGain.gain.setTargetAtTime(0.02 + overwhelmProg * 0.025, now, 0.1);
      this.carrierGain.gain.setTargetAtTime(0.02, now, 0.1);
      this.carrierOsc.frequency.setTargetAtTime(880, now, 0.1);
    } else if (clampedP < 0.63) {
      // Scene 4: The Deviation - noise falls away, carrier Doppler frequency shifts downward
      const devProg = (clampedP - 0.45) / 0.18;
      const noiseLevel = 0.045 * (1 - devProg) + 0.008 * devProg;
      this.noiseGain.gain.setTargetAtTime(noiseLevel, now, 0.1);
      this.carrierGain.gain.setTargetAtTime(0.032, now, 0.1);
      const targetFreq = 880 - devProg * 44;
      this.carrierOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
    } else if (clampedP < 0.81) {
      // Scene 5: Investigation - clean isolation, noise near zero, pure carrier tone
      this.noiseGain.gain.setTargetAtTime(0.005, now, 0.1);
      this.carrierGain.gain.setTargetAtTime(0.035, now, 0.1);
      this.carrierOsc.frequency.setTargetAtTime(836, now, 0.1);
    } else {
      // Scene 6: Candidate - serene resolution
      this.noiseGain.gain.setTargetAtTime(0.004, now, 0.1);
      this.carrierGain.gain.setTargetAtTime(0.03, now, 0.1);
      this.carrierOsc.frequency.setTargetAtTime(836, now, 0.1);
    }
  }

  public updateCarrierPresence(intensity: number, driftFactor: number = 0) {
    if (!this.carrierGain || !this.carrierOsc || !this.ctx || !this.isRunning) return;
    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    const targetGain = clampedIntensity * 0.035;
    this.carrierGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);

    // Doppler shift pitch slightly
    const baseFreq = 880;
    const newFreq = baseFreq + driftFactor * 24;
    this.carrierOsc.frequency.setTargetAtTime(newFreq, this.ctx.currentTime, 0.1);
  }

  public mute() {
    if (this.isRunning && this.masterGain && this.ctx) {
      this.isRunning = false;
      this.masterGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.05);
    }
  }

  public getStatus(): boolean {
    return this.isRunning;
  }

  public destroy() {
    try {
      this.noiseNode?.stop();
      this.carrierOsc?.stop();
      this.ctx?.close();
    } catch {
      // Ignored during unmount
    }
  }
}

export const observatoryAudio = new ObservatoryAudioEngine();

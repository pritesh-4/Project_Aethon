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

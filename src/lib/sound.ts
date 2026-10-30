/**
 * Tiny synthesised sound effects built on the Web Audio API.
 * No audio files are shipped; every sound is generated on the fly.
 */

type SoundName = 'key' | 'error' | 'word' | 'finish' | 'record' | 'miss'

let context: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    if (!context) context = new Ctor()
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return null
  }
}

function getNoise(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer
  const length = Math.floor(ctx.sampleRate * 0.05)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  noiseBuffer = buffer
  return buffer
}

function click(ctx: AudioContext, volume: number, frequency: number) {
  const now = ctx.currentTime
  const source = ctx.createBufferSource()
  source.buffer = getNoise(ctx)
  source.playbackRate.value = 0.9 + Math.random() * 0.25

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = frequency
  filter.Q.value = 1.4

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045)

  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start(now)
  source.stop(now + 0.06)
}

function tone(ctx: AudioContext, volume: number, frequency: number, start: number, duration: number, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export function playSound(name: SoundName, volume = 0.5): void {
  const ctx = getContext()
  if (!ctx) return
  const v = Math.max(0.0002, Math.min(1, volume))
  const now = ctx.currentTime
  try {
    switch (name) {
      case 'key':
        click(ctx, 0.35 * v, 2400 + Math.random() * 600)
        break
      case 'word':
        click(ctx, 0.3 * v, 1700)
        break
      case 'error':
        tone(ctx, 0.12 * v, 150, now, 0.09, 'triangle')
        break
      case 'miss':
        tone(ctx, 0.12 * v, 220, now, 0.08, 'triangle')
        tone(ctx, 0.1 * v, 140, now + 0.07, 0.14, 'triangle')
        break
      case 'finish':
        tone(ctx, 0.07 * v, 660, now, 0.18)
        tone(ctx, 0.07 * v, 880, now + 0.09, 0.26)
        break
      case 'record':
        tone(ctx, 0.07 * v, 523.25, now, 0.2)
        tone(ctx, 0.07 * v, 659.25, now + 0.1, 0.2)
        tone(ctx, 0.08 * v, 783.99, now + 0.2, 0.36)
        break
    }
  } catch {
    /* Audio is a nice-to-have; never let it break typing. */
  }
}

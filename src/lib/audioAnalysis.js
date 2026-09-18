// WebAudio tap for the sound-reactive wallpaper.
//
// This lives outside React on purpose: the canvas polls getAudioLevel() once per
// frame, and routing that through state would re-render the whole app 60x a
// second. Nothing here throws - if the browser refuses, the wallpaper just stays
// at its resting state and playback is untouched.

let audioContext = null
let analyser = null
let binData = null
let tappedElement = null
let level = 0

const FFT_SIZE = 256
const SMOOTHING = 0.85
// Fast to rise, slow to fall, so the glow breathes instead of twitching.
const ATTACK = 0.6
const RELEASE = 0.07
// Most musical energy sits below this share of the spectrum.
const USABLE_BAND = 0.6
const FULL_SCALE = 0.5 * 255

/** True once the audio element is actually being analysed. */
export const isAudioAnalysisAttached = () => Boolean(analyser)

/**
 * Routes an <audio> element through an AnalyserNode. Must be called from a user
 * gesture: a suspended AudioContext would send playback through a silent graph,
 * so the element is only tapped once the context is confirmed running.
 */
export async function attachAudioAnalysis(audio) {
  if (typeof window === 'undefined' || !audio) return

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return

  try {
    if (!audioContext) audioContext = new AudioContextClass()
    if (audioContext.state !== 'running') await audioContext.resume()
    if (audioContext.state !== 'running') return
    if (tappedElement === audio) return

    const source = audioContext.createMediaElementSource(audio)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = FFT_SIZE
    analyser.smoothingTimeConstant = SMOOTHING
    binData = new Uint8Array(analyser.frequencyBinCount)

    source.connect(analyser)
    analyser.connect(audioContext.destination)
    tappedElement = audio
  } catch (error) {
    // Slots are one-shot: if the tap fails, keep playing audio normally.
    console.warn('Echo: audio analysis unavailable, wallpaper stays static.', error)
    analyser = null
    binData = null
  }
}

/**
 * Overall loudness as 0..1, smoothed. Returns 0 when nothing is playing or the
 * analyser could not be attached.
 */
export function getAudioLevel() {
  if (!analyser || !binData) return 0

  analyser.getByteFrequencyData(binData)

  const bandCount = Math.max(1, Math.floor(binData.length * USABLE_BAND))
  let sum = 0
  for (let i = 0; i < bandCount; i += 1) sum += binData[i]
  const raw = Math.min(1, sum / bandCount / FULL_SCALE)

  level += (raw - level) * (raw > level ? ATTACK : RELEASE)
  return level
}

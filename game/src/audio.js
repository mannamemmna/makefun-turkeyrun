// Optional sound: a handful of tiny WebAudio blips, created lazily on the first user gesture so
// nothing in the page ever touches an AudioContext before the browser allows it. If WebAudio is
// missing or throws, every call quietly does nothing — the game never depends on sound.

const RECIPES = {
  start: [[392, 0.09, 'square'], [523, 0.09, 'square'], [659, 0.14, 'square']],
  jump: [[300, 0.12, 'sine', 620]],
  land: [[140, 0.08, 'triangle']],
  corn: [[880, 0.06, 'sine'], [1175, 0.09, 'sine']],
  hit: [[220, 0.22, 'sawtooth', 90]],
  caught: [[330, 0.16, 'square'], [262, 0.16, 'square'], [196, 0.3, 'square']],
  escaped: [[523, 0.1, 'square'], [659, 0.1, 'square'], [784, 0.1, 'square'], [1047, 0.28, 'square']],
  pause: [[440, 0.06, 'sine']],
};

export function createSoundBox() {
  let ctx = null;
  let unlocked = false;

  function ensureContext() {
    if (ctx) return ctx;
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  return {
    /** Call from a real keydown/click; after this, blips are allowed. */
    unlock() {
      const ac = ensureContext();
      if (!ac) return;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      unlocked = true;
    },
    /**
     * Play one named recipe (see RECIPES). Each entry is [freq, dur, wave, optional glide-to freq].
     * Silent until unlocked, and silent forever if audio is unavailable.
     */
    play(name) {
      if (!unlocked) return;
      const ac = ctx;
      if (!ac || ac.state !== 'running') return;
      const recipe = RECIPES[name];
      if (!recipe) return;
      let at = ac.currentTime;
      for (const [freq, dur, wave, glide] of recipe) {
        try {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = wave;
          osc.frequency.setValueAtTime(freq, at);
          if (glide) osc.frequency.exponentialRampToValueAtTime(glide, at + dur);
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.exponentialRampToValueAtTime(0.12, at + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
          osc.connect(gain).connect(ac.destination);
          osc.start(at);
          osc.stop(at + dur + 0.02);
        } catch {
          // one bad note must never break the run
        }
        at += dur;
      }
    },
  };
}

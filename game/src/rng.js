// The game's only source of randomness: a seeded mulberry32 stream, so a given seed always builds
// the same run. Every spawner draws from one shared stream in a fixed order, which is what lets
// the screenshot scenes reproduce frame-for-frame.

/** Turn any text or number into a 32-bit seed. */
export function hashSeed(value) {
  const text = String(value);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A deterministic random stream: call() gives [0,1); range(a,b) a float; int(a,b) a whole number. */
export function createRng(seed) {
  let state = seed >>> 0;
  function call() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    call,
    range: (a, b) => a + (b - a) * call(),
    int: (a, b) => a + Math.floor(call() * (b - a + 1)),
    pick: (list) => list[Math.floor(call() * list.length)],
  };
}

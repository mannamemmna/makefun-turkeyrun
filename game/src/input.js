// Keyboard in, clean commands out. Holds the set of physically-down keys, turns them into the
// four things the world asks for each step (slide, jump edge, duck hold, pause edge, confirm edge)
// and swallows repeats so a held key never re-jumps. No game logic lives here.

const LEFT_KEYS = ['ArrowLeft', 'KeyA'];
const RIGHT_KEYS = ['ArrowRight', 'KeyD'];
const JUMP_KEYS = ['ArrowUp', 'KeyW'];
const DUCK_KEYS = ['ArrowDown', 'KeyS'];
const CONFIRM_KEYS = ['Space', 'Enter'];
const PAUSE_KEYS = ['KeyP'];

export function createKeyboard() {
  const down = new Set();
  const edges = new Set(); // keycodes pressed since the last consume
  let slide = 0;
  let duck = false;

  function onKeyDown(event) {
    if (event.repeat) return;
    if ([...LEFT_KEYS, ...RIGHT_KEYS, ...JUMP_KEYS, ...DUCK_KEYS, ...CONFIRM_KEYS, ...PAUSE_KEYS].includes(event.code)) {
      event.preventDefault();
    }
    if (!down.has(event.code)) edges.add(event.code);
    down.add(event.code);
  }
  function onKeyUp(event) {
    down.delete(event.code);
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => down.clear());

  function anyDown(list) {
    return list.some((k) => down.has(k));
  }
  function anyEdge(list) {
    return list.some((k) => edges.has(k));
  }

  return {
    /** Fold the raw keys into this step's command object. Call once per fixed step. */
    readCommand() {
      slide = (anyDown(RIGHT_KEYS) ? 1 : 0) - (anyDown(LEFT_KEYS) ? 1 : 0);
      duck = anyDown(DUCK_KEYS);
      const jump = anyEdge(JUMP_KEYS);
      const confirm = anyEdge(CONFIRM_KEYS);
      const pause = anyEdge(PAUSE_KEYS);
      edges.clear();
      return { slide, duck, jump, confirm, pause };
    },
    /** Forget everything (used when a run starts so held keys do not fire at once). */
    clear() {
      down.clear();
      edges.clear();
    },
  };
}

// One home for every tunable number and colour: view size, physics, the run's length, the score
// rules, the autumn palette, and the two helpers that turn distance into speed and zone. Nothing
// here draws or moves; it only answers "how much" and "what colour".

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 592; // the y of the dirt the turkey runs on
export const STEP_DT = 1 / 60; // fixed physics step the whole game ticks on

// Physics
export const GRAVITY = 3100; // px/s^2 pulling the turkey down
export const JUMP_VELOCITY = -1080; // px/s launch
export const FAST_FALL_VELOCITY = 1500; // ducking mid-air slams the turkey down
export const STRAFE_SPEED = 260; // px/s the turkey slides left/right on screen

// The run: 1500 yards from the farmyard, past the barn, into the kitchen, out to the freedom field.
export const PX_PER_YARD = 10;
export const ESCAPE_YARDS = 1500;
export const RUN_SPEED_START = 340; // px/s of world scroll at 0 yards
export const RUN_SPEED_MAX = 640; // px/s at the escape line
export const STRAFE_X_MIN = 190;
export const STRAFE_X_MAX = 640;

// Scoring and lives
export const MAX_LIVES = 3;
export const CORN_SCORE = 25;
export const HIT_INVULN_SECONDS = 1.4;
export const BEST_KEY = 'turkeyRunBestV1';

// Zones: farm (0-500 yd), barn (500-1000 yd), kitchen (1000-1500 yd), blended over a band.
export const ZONE_FARM = 'farm';
export const ZONE_BARN = 'barn';
export const ZONE_KITCHEN = 'kitchen';
export const ZONE_BLEND_YARDS = 90;

/** World scroll speed in px/s at a given yard count: a gentle, continuous ramp. */
export function speedAtYards(yards) {
  const t = Math.min(1, Math.max(0, yards / ESCAPE_YARDS));
  return RUN_SPEED_START + (RUN_SPEED_MAX - RUN_SPEED_START) * t * (0.65 + 0.35 * t);
}

/** Which stage of the escape the turkey is in at a yard count. */
export function zoneAtYards(yards) {
  if (yards < 500) return ZONE_FARM;
  if (yards < 1000) return ZONE_BARN;
  return ZONE_KITCHEN;
}

/** 0..1 how far into the blend band toward the next zone (0 = pure current zone). */
export function zoneBlend(yards) {
  const edge = yards < 500 ? 500 : yards < 1000 ? 1000 : ESCAPE_YARDS;
  const near = edge - yards;
  if (yards >= 1000 || near > ZONE_BLEND_YARDS || near <= 0) return 0;
  return 1 - near / ZONE_BLEND_YARDS;
}

// The palette: warm autumn, chunky dark outlines, cream highlights.
export const PAINT = {
  ink: '#2a1408', // every outline
  cream: '#ffedcf', // highlights, title fill
  butter: '#ffd98a',
  turkeyBody: '#8a4a22',
  turkeyDark: '#5d2f14',
  turkeyBelly: '#c98a4e',
  wattle: '#d8433a',
  beak: '#f2a93b',
  legs: '#e8842a',
  corn: '#ffc93c',
  cornHusk: '#8fae4e',
  heart: '#e5484d',
  steel: '#cfd8e3',
  rust: '#9a5b2c',
  fire: '#ff7a2f',
  hay: '#d9a441',
};

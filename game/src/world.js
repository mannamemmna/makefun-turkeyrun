// The game state machine and the one place every subsystem meets: it owns the turkey, farmer,
// hazard field, corn, particles and score, steps them in a fixed order, resolves hits and the
// escape line, and draws the whole frame in layer order (backdrop, farmer, hazards, corn, turkey,
// particles, HUD, screen plate). Screens never mutate state; the world never draws screen art.

import {
  CORN_SCORE, ESCAPE_YARDS, GROUND_Y, MAX_LIVES, PX_PER_YARD, zoneAtYards, speedAtYards,
} from './config.js';
import { drawBackdrop } from './parallax.js';
import { Turkey, TURKEY_JUMPED, TURKEY_LANDED, drawTurkey } from './turkey.js';
import { FarmerChaser } from './farmer.js';
import { HazardField } from './hazards.js';
import { CornField } from './pickups.js';
import { ParticleSky } from './particles.js';
import { drawHud, drawPausePlate } from './hud.js';
import { drawCaughtScreen, drawEscapedScreen, drawTitleScreen } from './screens.js';

export const STATE_TITLE = 'title';
export const STATE_RUNNING = 'running';
export const STATE_PAUSED = 'paused';
export const STATE_CAUGHT = 'caught';
export const STATE_ESCAPED = 'escaped';

const ESCAPE_BONUS = 500;
const SHAKE_SECONDS = 0.35;
const SHAKE_MAGNITUDE = 11;

export class GameWorld {
  constructor(rng, sound) {
    this.rng = rng;
    this.sound = sound ?? { play() {} };
    this.turkey = new Turkey();
    this.farmer = new FarmerChaser();
    this.hazards = new HazardField();
    this.corn = new CornField();
    this.particles = new ParticleSky();
    this.best = 0;
    this.reset();
  }

  /** Back to the title card: fresh sub-systems, no run state left over. */
  reset() {
    this.state = STATE_TITLE;
    this.timeSecs = 0;
    this.yards = 0;
    this.scrollPx = 0;
    this.score = 0;
    this.cornCount = 0;
    this.lives = MAX_LIVES;
    this.shakeT = 0;
    this.dustTimer = 0;
    this.zone = zoneAtYards(0);
    this.turkey.reset();
    this.farmer.reset();
    this.hazards.reset(this.rng);
    this.corn.reset(this.rng);
    this.particles.reset();
  }

  /** Title -> running. Clears the field so the run starts clean. */
  beginRun() {
    this.reset();
    this.state = STATE_RUNNING;
    this.sound.play('start');
  }

  togglePause() {
    if (this.state === STATE_RUNNING) this.state = STATE_PAUSED;
    else if (this.state === STATE_PAUSED) this.state = STATE_RUNNING;
    this.sound.play('pause');
  }

  /** One fixed step. `command` is {slide, duck, jump, confirm, pause} from the input layer. */
  step(dt, command) {
    this.timeSecs += dt;
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.state === STATE_RUNNING) this.stepRun(dt, command);
    else if (this.state === STATE_TITLE) {
      this.scrollPx += 26 * dt; // slow golden-hour drift behind the title
      this.turkey.animT += dt;
    } else if (this.state === STATE_CAUGHT || this.state === STATE_ESCAPED) {
      this.particles.update(dt, 0); // confetti keeps falling on the escape plate
    }
  }

  stepRun(dt, command) {
    const speed = speedAtYards(this.yards);
    const ev = this.turkey.update(dt, command);
    if (ev & TURKEY_JUMPED) {
      this.sound.play('jump');
      this.particles.emitDust(this.turkey.x, GROUND_Y - 4, 6, this.rng);
    }
    if (ev & TURKEY_LANDED) {
      this.sound.play('land');
      this.particles.emitDust(this.turkey.x, GROUND_Y - 4, 8, this.rng);
    }
    this.scrollPx += speed * dt;
    this.yards += (speed * dt) / PX_PER_YARD;
    this.zone = zoneAtYards(this.yards);

    const hitKind = this.hazards.update(dt, speed, this.yards, this.turkey.collisionBox(), this.timeSecs);
    if (hitKind && this.turkey.hit()) {
      this.lives -= 1;
      this.shakeT = SHAKE_SECONDS;
      this.sound.play('hit');
      this.particles.emitFeathers(this.turkey.x, this.turkey.y - 60, 14, this.rng);
      this.farmer.celebrate();
      if (this.lives <= 0) {
        this.state = STATE_CAUGHT;
        this.sound.play('caught');
        return;
      }
    }

    const eaten = this.corn.update(dt, speed, this.turkey.collisionBox(), this.timeSecs);
    if (eaten > 0) {
      this.cornCount += eaten;
      this.sound.play('corn');
      this.particles.emitSparkles(this.turkey.x + 20, this.turkey.y - 70, 8 * eaten, this.rng);
    }

    this.dustTimer -= dt;
    if (this.dustTimer <= 0 && this.turkey.onGround) {
      this.dustTimer = 0.12;
      this.particles.emitDust(this.turkey.x - 24, GROUND_Y - 3, 2, this.rng);
    }

    this.farmer.update(dt, speed);
    this.particles.update(dt, speed);
    this.score = Math.floor(this.yards) + this.cornCount * CORN_SCORE;

    if (this.yards >= ESCAPE_YARDS) {
      this.yards = ESCAPE_YARDS;
      this.score += ESCAPE_BONUS;
      this.state = STATE_ESCAPED;
      this.sound.play('escaped');
      this.particles.emitConfetti(150, this.rng);
    }
  }

  /** Paint one full frame: world layers under screen shake, then HUD and the screen plate. */
  draw(ctx) {
    ctx.save();
    if (this.shakeT > 0) {
      const k = (this.shakeT / SHAKE_SECONDS) * SHAKE_MAGNITUDE;
      // deterministic wobble (never the spawn rng, so shaking cannot alter the run)
      ctx.translate(Math.sin(this.timeSecs * 91) * k, Math.sin(this.timeSecs * 137 + 2) * k * 0.7);
    }
    drawBackdrop(ctx, { yards: this.yards, scrollPx: this.scrollPx, timeSecs: this.timeSecs });
    if (this.state === STATE_RUNNING || this.state === STATE_PAUSED) {
      this.farmer.draw(ctx);
      this.hazards.draw(ctx, this.timeSecs);
      this.corn.draw(ctx, this.timeSecs);
      drawTurkey(ctx, this.turkey);
      this.particles.draw(ctx);
    }
    ctx.restore();

    if (this.state === STATE_RUNNING || this.state === STATE_PAUSED) drawHud(ctx, this);
    else if (this.state === STATE_TITLE) drawTitleScreen(ctx, this.timeSecs, this.best);
    else if (this.state === STATE_CAUGHT) {
      drawCaughtScreen(ctx, this);
      this.particles.draw(ctx);
    } else if (this.state === STATE_ESCAPED) {
      drawEscapedScreen(ctx, this);
      this.particles.draw(ctx);
    }
    if (this.state === STATE_PAUSED) drawPausePlate(ctx);
  }
}

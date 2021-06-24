import Projectile from "./projectile";
import Alien from "./alien";
import Game from "./game";
import GameObject from "./gameObject";

export default class Tower extends GameObject {
  range: number;
  power: number;
  projectileSpeed: number;
  cooldown: number;
  lastFired: number;
  angle: number;
  target: Alien | null;

  constructor(
    game: Game,
    x: number,
    y: number,
    width: number,
    height: number,
    range: number,
    cooldown: number,
    projectileSpeed: number,
    power: number
  ) {
    super(game, x, y, width, height);

    // stats
    this.range = range;
    this.cooldown = cooldown;
    this.projectileSpeed = projectileSpeed;
    this.power = power;

    // attack
    this.angle = 0;
    this.target = null;
    this.lastFired = Date.now();
  }

  findTarget() {
    if (this.target && !this.game.aliens.has(this.target.id))
      this.target = null;
    if (!this.target) {
      this.game.aliens.forEach((alien) => {
        if (this.game.calculateDistance(this, alien) < this.range) {
          this.target = alien;
          return;
        }
      });
    }
  }

  changeAngle() {
    if (this.target) {
      let dx = this.x - this.target.x;
      let dy = this.y - this.target.y;
      this.angle = Math.atan2(dy, dx) - Math.PI;
    }
  }

  checkFire() {
    if (this.target) {
      const now = Date.now();
      const distanceToTarget = this.game.calculateDistance(this, this.target);
      if (this.range > distanceToTarget) {
        if (now - this.lastFired > this.cooldown) {
          this.game.projectiles.push(
            new Projectile(
              this.game,
              this.x + this.width / 2,
              this.y + this.height / 2,
              this.angle,
              this.projectileSpeed,
              this.power,
              2000
            )
          );
          this.lastFired = now;
        }
      } else {
        this.target = null;
      }
    }
  }

  draw() {
    this.game.ctx.save();

    this.game.ctx.fillStyle = "blue";
    this.game.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    this.game.ctx.rotate(this.angle);
    this.game.ctx.translate(
      -(this.x + this.width / 2),
      -(this.y + this.height / 2)
    );
    this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
    this.game.ctx.fillStyle = "black";
    this.game.ctx.font = "30px Arial";
    this.game.ctx.fillText("===", this.x + 15, this.y + 30);
    if (
      this.game.mouse.x &&
      this.game.mouse.y &&
      this.game.collisionDetection(this, this.game.mouse)
    ) {
      this.game.ctx.beginPath();
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      this.game.ctx.arc(centerX, centerY, this.range, 0, Math.PI * 2);
      this.game.ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
      this.game.ctx.fill();
    }

    this.game.ctx.restore();
  }

  update() {
    this.findTarget();
    this.changeAngle();
    this.checkFire();
  }
}

import Game from "./game";
import GameObject from "./gameObject";

export default class Projectile extends GameObject {
  startingX: number;
  startingY: number;
  power: number;
  speed: number;
  range: number;
  angle: number;
  destroyed: boolean;

  constructor(
    game: Game,
    x: number,
    y: number,
    angle: number,
    speed: number,
    power: number,
    range: number
  ) {
    super(game, x, y, 10, 10);
    this.startingX = x;
    this.startingY = y;
    this.angle = angle;
    this.speed = speed;
    this.power = power;
    this.range = range;
    this.destroyed = false;
  }

  checkOutOfRange(): boolean {
    const deltaX = Math.abs(this.x - this.startingX);
    const deltaY = Math.abs(this.y - this.startingY);
    const dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));

    return dist > this.range;
  }

  checkIfDestroyed() {
    if (this.checkOutOfRange()) {
      this.destroyed = true;
      return;
    }

    if (
      this.x > this.game.canvas.width - this.game.cellSize ||
      this.x < 0 ||
      this.y > this.game.canvas.height ||
      this.y < 0
    ) {
      this.destroyed = true;
      return;
    }

    this.game.aliens.forEach((alien) => {
      if (this.game.collisionDetection(this, alien)) {
        alien.health -= this.power;
        this.destroyed = true;
        return;
      }
    });
  }

  update() {
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
    this.checkIfDestroyed();
  }

  draw() {
    this.game.ctx.save();

    this.game.ctx.fillStyle = "black";
    this.game.ctx.beginPath();
    this.game.ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    this.game.ctx.fill();

    this.game.ctx.restore();
  }
}

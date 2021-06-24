import Game from "./game";
import GameObject from "./gameObject";

export default class Cell extends GameObject {
  constructor(game: Game, x: number, y: number, size: number) {
    super(game, x, y, size, size);
  }

  draw() {
    this.game.ctx.save();

    if (
      this.game.mouse.x &&
      this.game.mouse.y &&
      this.game.collisionDetection(this, this.game.mouse)
    ) {
      this.game.ctx.strokeStyle = "black";
      this.game.ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    this.game.ctx.restore();
  }
}

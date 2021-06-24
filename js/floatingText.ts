import Game from "./game";
import GameObject from "./gameObject";

export default class FloatingText extends GameObject {
  text: string;
  size: number;
  color: string;
  lifespan: number;
  opacity: number;

  constructor(
    game: Game,
    text: string,
    x: number,
    y: number,
    size: number,
    color: string
  ) {
    super(game, x, y);
    this.text = text;
    this.size = size;
    this.color = color;
    this.lifespan = 0;
    this.opacity = 1;
  }

  update = () => {
    this.y -= 0.3;
    this.lifespan += 1;
    if (this.opacity > 0.05) this.opacity -= 0.02;
  };

  draw = () => {
    this.game.ctx.globalAlpha = this.opacity;
    this.game.ctx.fillStyle = this.color;
    this.game.ctx.font = this.size + "px Arial";
    this.game.ctx.fillText(this.text, this.x, this.y);
    this.game.ctx.globalAlpha = 1;
  };
}

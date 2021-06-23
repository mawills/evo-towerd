import Game from "./game";

export default class Alien {
  game: Game;
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  movement: number;
  health: number;
  maxHealth: number;
  lootValue: number;

  constructor(
    game: Game,
    y: number,
    width: number,
    height: number,
    health: number,
    speed: number
  ) {
    this.game = game;
    this.id = Math.random();
    this.x = this.game.canvas.width;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.movement = this.speed;
    this.health = health;
    this.maxHealth = this.health;
    this.lootValue = 20;
  }

  alive() {
    return this.health > 0;
  }

  update() {
    this.x -= this.movement;
  }

  draw() {
    this.game.ctx.save();

    this.game.ctx.fillStyle = "red";
    this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
    this.game.ctx.fillStyle = "black";
    this.game.ctx.font = "30px Arial";
    this.game.ctx.fillText(
      Math.floor(this.health) + "/" + Math.floor(this.maxHealth),
      this.x + 15,
      this.y + 30
    );

    this.game.ctx.restore();
  }
}

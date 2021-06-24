import Cell from "./cell";
import { Mouse, defaultMouse } from "./mouse";
import Tower from "./tower";
import Alien from "./alien";
import Projectile from "./projectile";
import config from "./configuration";
import FloatingText from "./floatingText";
import Population from "./population";

type GameObject = Tower | Alien | Projectile;

interface ControlsBar {
  width: number;
  height: number;
}

export default class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cellSize: number;
  cellGap: number;
  grid: Cell[];
  towers: Map<string, Tower>;
  aliens: Map<number, Alien>;
  projectiles: Projectile[];
  floatingTexts: FloatingText[];
  controlsBar: ControlsBar;
  mouse: Mouse;
  alienSpawnInterval: number;
  numResources: number;
  towerCost: number;
  waveSize: number;
  waveGrowthSize: number;
  waveCount: number;
  numKills: number;
  frame: number;
  gameOver: boolean;
  nextWaveButton: HTMLButtonElement;
  waveInProgress: boolean;
  population: Population;
  attackWave: Alien[];
  gameStarted: boolean;

  constructor() {
    // canvas
    this.canvas = <HTMLCanvasElement>document.getElementById("canvas");
    this.canvas.width = config.CANVAS_WIDTH;
    this.canvas.height = config.CANVAS_HEIGHT;
    let ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    this.ctx = ctx;

    // grid
    this.cellSize = config.CELL_SIZE;
    this.cellGap = config.CELL_GAP;
    this.grid = [];

    // game objects
    this.towers = new Map();
    this.aliens = new Map();
    this.projectiles = [];
    this.floatingTexts = [];

    // alien population
    this.population = new Population(this, config.ENEMY_STARTING_POPULATION);
    this.attackWave = [];

    // stats
    this.numResources = config.PLAYER_STARTING_RESOURCES;
    this.numKills = 0;
    this.waveCount = 0;

    // wave control
    this.waveInProgress = false;
    this.alienSpawnInterval = config.ENEMY_SPAWN_INTERVAL;
    this.waveSize = config.STARTING_WAVE_SIZE;
    this.waveGrowthSize = config.WAVE_GROWTH;

    this.controlsBar = {
      width: this.canvas.width,
      height: this.cellSize,
    };
    this.mouse = { ...defaultMouse, game: this };
    this.towerCost = config.TOWER_COST;
    this.frame = 0;
    this.nextWaveButton = <HTMLButtonElement>(
      document.getElementById("next-wave")
    );
    this.gameStarted = false;
    this.gameOver = false;

    this.populateGrid();
    this.handleMouseMovement();
    this.handleCanvasClicks();
    this.handleNextWaveButton();
  }

  start = () => {
    this.animate();
  };

  animate = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.handleGrid();
    this.handleTowers();
    this.handleProjectiles();
    this.handleAliens();
    this.handleGameStatus();
    this.handleFloatingTexts();
    this.handleAttackWave();
    this.frame += 1;
    if (!this.gameOver) requestAnimationFrame(this.animate);
  };

  collisionDetection(first: Mouse, second: GameObject | Mouse) {
    if (
      first.x >= second.x + second.width ||
      second.x >= first.x + first.width ||
      first.y >= second.y + second.height ||
      second.y >= first.y + first.height
    ) {
      return false;
    }
    return true;
  }

  calculateDistance(first: GameObject, second: GameObject) {
    const deltaX = Math.abs(first.x - second.x);
    const deltaY = Math.abs(first.y - second.y);
    return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
  }

  handleMouseMovement = () => {
    const canvasPosition = this.canvas.getBoundingClientRect();
    this.canvas.addEventListener("mousemove", (e) => {
      this.mouse.x = e.x - canvasPosition.left;
      this.mouse.y = e.y - canvasPosition.top;
    });
    this.canvas.addEventListener("mouseleave", () => {
      this.mouse.x = 0;
      this.mouse.y = 0;
    });
  };

  placeTower() {
    const gridPositionX = this.mouse.x - (this.mouse.x % this.cellSize);
    const gridPositionY = this.mouse.y - (this.mouse.y % this.cellSize);
    const towerId = gridPositionX + "," + gridPositionY;
    if (gridPositionY < this.cellSize) return;
    if (this.towers.has(towerId)) return;
    if (this.numResources >= this.towerCost) {
      this.towers.set(
        towerId,
        new Tower(
          this,
          gridPositionX,
          gridPositionY,
          this.cellSize - this.cellGap * 2,
          this.cellSize - this.cellGap * 2,
          200,
          400,
          2,
          10
        )
      );
      this.numResources -= this.towerCost;
    } else {
      this.floatingTexts.push(
        new FloatingText(
          this,
          "Insufficient Resources",
          this.mouse.x,
          this.mouse.y,
          15,
          "red"
        )
      );
    }
  }

  handleCanvasClicks = () => {
    this.canvas.addEventListener("click", () => {
      this.placeTower();
    });
  };

  handleNextWaveButton = () => {
    this.nextWaveButton.addEventListener("click", () => {
      if (!this.gameStarted) this.gameStarted = true;
      this.waveCount += 1;
      if (this.waveCount > 1) this.population.reproduce();
      this.waveInProgress = true;
      this.waveSize = Math.floor(this.population.population.length / 2);
      this.nextWaveButton.disabled = true;
      this.nextWaveButton.innerText = "wave in progress";
      this.attackWave = this.population.createAttackWave(this.waveSize);
    });
  };

  populateGrid = () => {
    for (let y = this.cellSize; y < this.canvas.height; y += this.cellSize) {
      for (let x = 0; x < this.canvas.width; x += this.cellSize) {
        this.grid.push(new Cell(this, x, y, this.cellSize));
      }
    }
  };

  handleGrid = () => {
    for (const cell of this.grid) {
      cell.draw();
    }
  };

  handleProjectiles = () => {
    let temp: Projectile[] = [];
    this.projectiles.forEach((projectile) => {
      projectile.update();
      projectile.draw();
      if (!projectile.destroyed) temp.push(projectile);
    });
    this.projectiles = temp;
  };

  handleTowers = () => {
    this.towers.forEach((tower) => {
      tower.update();
      tower.draw();
    });
  };

  handleAliens = () => {
    this.aliens.forEach((alien, key) => {
      alien.update();
      alien.draw();
      if (alien.x + alien.width < 0) {
        alien.x = this.canvas.width;
        this.population.population.push(alien);
        this.aliens.delete(key);
      }
      if (!alien.alive) {
        this.aliens.delete(key);
        this.floatingTexts.push(
          new FloatingText(
            this,
            "+" + alien.lootValue,
            alien.x,
            alien.y,
            15,
            "black"
          )
        );
        this.numResources += alien.lootValue;
        this.numKills += 1;
      }
    });

    if (this.waveInProgress && this.frame % this.alienSpawnInterval === 0) {
      let temp = this.attackWave.pop();
      if (temp) this.aliens.set(temp.id, temp);
      if (this.alienSpawnInterval > 120) this.alienSpawnInterval -= 50;
    }
  };

  handleAttackWave = () => {
    if (this.gameStarted && !this.waveInProgress) {
      this.nextWaveButton.disabled = false;
      this.nextWaveButton.innerText = "next wave";
    }

    if (this.attackWave.length == 0 && this.aliens.size == 0) {
      this.waveInProgress = false;
    }
  };

  handleGameStatus = () => {
    this.ctx.fillStyle = "blue";
    this.ctx.fillRect(0, 0, this.controlsBar.width, this.controlsBar.height);
    this.ctx.fillStyle = "gold";
    this.ctx.font = "30px Arial";
    this.ctx.fillText("Resources: " + this.numResources, 20, 35);
    this.ctx.fillText("Kills: " + this.numKills, 270, 35);
    this.ctx.fillText(
      "Population: " +
        (this.population.population.length +
          this.aliens.size +
          this.attackWave.length),
      this.canvas.width - 300,
      35
    );
    if (this.gameOver) {
      this.ctx.fillStyle = "black";
      this.ctx.font = "90px Arial";
      this.ctx.fillText("GAME OVER", 135, 330);
    }
  };

  handleFloatingTexts = () => {
    let temp: FloatingText[] = [];
    this.floatingTexts.forEach((floatingText) => {
      floatingText.update();
      floatingText.draw();
      if (floatingText.lifespan < config.FLOATING_TEXT_LIFESPAN) {
        temp.push(floatingText);
      }
    });
    this.floatingTexts = temp;
  };
}

import Cell from "./cell";
import Mouse from "./mouse";
import Tower from "./tower";
import Alien from "./alien";
import Projectile from "./projectile";
import Configuration from "./configuration";
import FloatingText from "./floatingText";
import Population from "./population";
import Dom from "./dom";

export default class Game {
  config: Configuration;
  nextWaveButton: HTMLButtonElement;
  stats: HTMLDivElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cellSize: number;
  cellGap: number;
  grid: Cell[];
  towers: Map<string, Tower>;
  aliens: Map<number, Alien>;
  projectiles: Projectile[];
  floatingTexts: FloatingText[];
  mouse: Mouse;
  alienSpawnInterval: number;
  numResources: number;
  towerCost: number;
  waveSize: number;
  waveCount: number;
  numKills: number;
  gameOver: boolean;
  waveInProgress: boolean;
  population: Population;
  attackWave: Alien[];
  minWaveSize: number;
  gameStarted: boolean;
  lastSpawnedTime: number;
  minSpawnInterval: number;
  spawnIntervalDecrement: number;

  constructor(dom: Dom, config: Configuration) {
    this.config = config;

    // dom
    this.nextWaveButton = dom.nextWaveButton;
    this.stats = dom.stats;

    // canvas
    this.canvas = dom.canvas;
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
    this.alienSpawnInterval = config.INITIAL_SPAWN_INTERVAL;
    this.minSpawnInterval = config.MIN_SPAWN_INTERVAL;
    this.spawnIntervalDecrement = config.SPAWN_INTERVAL_DECREMENT;
    this.waveSize = config.STARTING_WAVE_SIZE;
    this.minWaveSize = config.MIN_WAVE_SIZE;
    this.lastSpawnedTime = 0;

    this.mouse = new Mouse(config);
    this.towerCost = config.TOWER_COST;
    this.gameStarted = false;
    this.gameOver = false;

    this.populateGrid();
    this.handleMouseMovement();
    this.handleCanvasClicks();
    this.handleNextWaveButton();
  }

  start() {
    this.animate();
  }

  animate = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.handleGrid();
    this.handleTowers();
    this.handleProjectiles();
    this.handleAliens();
    this.handleFloatingTexts();
    this.handleAttackWave();
    this.handleGameStats();
    if (!this.gameOver) requestAnimationFrame(this.animate);
  };

  collisionDetection(
    first: Tower | Alien | Projectile | Mouse | Cell,
    second: Tower | Alien | Projectile | Mouse | Cell
  ) {
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

  calculateDistance(
    first: Tower | Alien | Projectile,
    second: Tower | Alien | Projectile
  ) {
    const deltaX = Math.abs(first.x - second.x);
    const deltaY = Math.abs(first.y - second.y);
    return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
  }

  handleMouseMovement() {
    const canvasPosition = this.canvas.getBoundingClientRect();
    this.canvas.addEventListener("mousemove", (e) => {
      this.mouse.update(e.x - canvasPosition.left, e.y - canvasPosition.top);
    });
    this.canvas.addEventListener("mouseleave", () => {
      this.mouse.update(0, 0);
    });
  }

  placeTower() {
    const gridPositionX = this.mouse.x - (this.mouse.x % this.cellSize);
    const gridPositionY = this.mouse.y - (this.mouse.y % this.cellSize);
    const towerId = gridPositionX + "," + gridPositionY;
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
          500,
          150,
          7,
          5
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

  handleCanvasClicks() {
    this.canvas.addEventListener("click", () => {
      this.placeTower();
    });
  }

  handleNextWaveButton() {
    this.nextWaveButton.addEventListener("click", () => {
      if (!this.gameStarted) this.gameStarted = true;

      this.nextWaveButton.disabled = true;
      this.nextWaveButton.innerText = "wave in progress";

      this.waveCount += 1;
      if (this.waveCount > 1) this.population.reproduce();

      this.waveSize = Math.floor(this.population.population.length / 2);
      if (this.waveSize <= this.minWaveSize)
        this.waveSize = Math.min(
          this.minWaveSize,
          this.population.population.length
        );

      this.waveInProgress = true;
      this.attackWave = this.population.createAttackWave(this.waveSize);
    });
  }

  populateGrid() {
    for (let y = 0; y < this.canvas.height; y += this.cellSize) {
      for (let x = 0; x < this.canvas.width; x += this.cellSize) {
        this.grid.push(new Cell(this, x, y, this.cellSize));
      }
    }
  }

  handleGameStats() {
    this.stats.innerText =
      "Resources: " +
      this.numResources +
      " " +
      "Kills: " +
      this.numKills +
      " " +
      "Wave: " +
      this.waveCount +
      " " +
      "Population: " +
      (this.population.population.length +
        this.aliens.size +
        this.attackWave.length);
  }

  handleGrid() {
    for (const cell of this.grid) {
      cell.draw();
    }
  }

  handleProjectiles() {
    let temp: Projectile[] = [];
    this.projectiles.forEach((projectile) => {
      projectile.update();
      projectile.draw();
      if (!projectile.destroyed) temp.push(projectile);
    });
    this.projectiles = temp;
  }

  handleTowers() {
    this.towers.forEach((tower) => {
      tower.update();
      tower.draw();
    });
  }

  handleAliens() {
    this.aliens.forEach((alien, key) => {
      alien.update();
      alien.draw();

      if (alien.x + alien.width < 0) {
        alien.x = this.canvas.width;
        this.population.population.push(alien);
        this.aliens.delete(key);
      }

      if (!alien.alive()) {
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

    if (
      this.waveInProgress &&
      Date.now() - this.lastSpawnedTime > this.alienSpawnInterval
    ) {
      let temp = this.attackWave.pop();
      if (temp) {
        this.aliens.set(temp.id, temp);
        this.lastSpawnedTime = Date.now();
        if (this.alienSpawnInterval > this.minSpawnInterval)
          this.alienSpawnInterval -= this.spawnIntervalDecrement;
      }
    }
  }

  handleAttackWave() {
    if (this.gameStarted && !this.waveInProgress) {
      this.nextWaveButton.disabled = false;
      this.nextWaveButton.innerText = "next wave";
    }

    if (this.attackWave.length == 0 && this.aliens.size == 0) {
      this.waveInProgress = false;
    }
  }

  handleFloatingTexts() {
    let temp: FloatingText[] = [];
    this.floatingTexts.forEach((floatingText) => {
      floatingText.update();
      floatingText.draw();
      if (floatingText.lifespan < this.config.FLOATING_TEXT_LIFESPAN) {
        temp.push(floatingText);
      }
    });
    this.floatingTexts = temp;
  }
}

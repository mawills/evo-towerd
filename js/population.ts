import Alien from "./alien";
import Game from "./game";

export default class Population {
  game: Game;
  population: Alien[];
  maxHeight: number;
  maxWidth: number;
  maxHealth: number;
  maxSpeed: number;
  minHeight: number;
  minWidth: number;
  minHealth: number;
  minSpeed: number;

  constructor(game: Game, n: number) {
    this.game = game;
    this.population = [];

    this.maxHeight = 100;
    this.minHeight = 10;

    this.maxWidth = 100;
    this.minWidth = 10;

    this.maxHealth = 300;
    this.minHealth = 50;

    this.maxSpeed = 1.5;
    this.minSpeed = 0.2;

    this.initializePopulation(n);
  }

  initializePopulation(n: number) {
    for (let i = 0; i < n; i++) {
      const height = this.game.randomNumberInRange(
        this.minHeight,
        this.maxHeight
      );
      this.population.push(
        new Alien(
          this.game,
          this.game.randomNumberInRange(
            height,
            this.game.canvas.height - height
          ),
          this.game.randomNumberInRange(this.minWidth, this.maxWidth),
          height,
          this.game.randomNumberInRange(this.minHealth, this.maxHealth),
          this.game.randomNumberInRange(this.minSpeed, this.maxSpeed)
        )
      );
    }
  }

  shufflePopulation() {
    // Fisher-Yates shuffle algorithm
    let count = this.population.length;
    let randomNumber = 0;
    let temp: Alien;
    while (count) {
      randomNumber = (Math.random() * count--) | 0;
      temp = this.population[count];
      this.population[count] = this.population[randomNumber];
      this.population[randomNumber] = temp;
    }
  }

  createAttackWave(n: number): Alien[] {
    this.shufflePopulation();
    let attackWave: Alien[] = [];
    for (let i = 0; i < n; i++) {
      let temp = this.population.pop();
      if (!temp) break;
      attackWave.push(temp);
    }

    return attackWave;
  }

  reproduce() {
    let offspring: Alien[] = [];
    let start = 0;
    let mid = Math.floor(this.population.length / 2);
    while (mid < this.population.length) {
      const parent1 = this.population[start];
      const parent2 = this.population[mid];

      const height = this.game.randomNumberInRange(
        parent1.height,
        parent2.height
      );

      offspring.push(
        new Alien(
          this.game,
          this.game.randomNumberInRange(
            height,
            this.game.canvas.height - height
          ),
          this.game.randomNumberInRange(parent1.width, parent2.width),
          height,
          this.game.randomNumberInRange(parent1.maxHealth, parent2.maxHealth),
          this.game.randomNumberInRange(parent1.speed, parent2.speed)
        )
      );
      start++;
      mid++;
    }

    offspring.forEach((child) => {
      this.population.push(child);
    });
  }
}

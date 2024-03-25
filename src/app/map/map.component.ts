import { Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../shared/game.service';
import { Subscription, interval, startWith, timeout } from 'rxjs';
import { Game, Planet, Player, Robot, RoundState } from '../shared/types';
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit, OnChanges, OnDestroy {
  killedRobotsByPlayer: Map<string, string[]> = new Map<string, string[]>();
  games: Game[];
  highlightedGame: number | null = 0;
  isDropdownOpen: boolean = false;
  highlightedState: string = '0';
  roundKeys: string[] = [];
  playerRobotMap: Map<string, string[]> = new Map<string, string[]>();
  playerColors = new Map<string, string>();
  upgrade = ""
  private colorsAssigned: boolean = false;
  private gameSubscription: Subscription;
  fetchMode: 'manual' | 'automatic' = 'manual';
  fetchInterval: number = 10;
  private fetchSubscription: Subscription | null = null;

  constructor(private gameService: GameService) {

  }
  ngOnInit(): void {

    // this.games = [this.generateRandomGame(2, 5, 20)];
    // this.roundKeys = Array.from(this.games[this.highlightedGame].round_states.keys());
    // this.assignRandomColors();
    // this.extractAndSetKilledRobotIds()
  }

  extractAndSetKilledRobotIds(): void {
    const killedRsByPlayer: Map<string, string[]> = new Map();

    const currentRoundState = this.games[this.highlightedGame]?.round_states?.get(this.highlightedState);
    if (currentRoundState) {
      this.games[this.highlightedGame].participating_players.forEach((playerName: string) => {
        if (this.games[this.highlightedGame]?.round_states?.get(this.highlightedState)?.player_name_player_map.get(playerName)) {
          const player = currentRoundState.player_name_player_map.get(playerName);
          if (player) {
            player.killed_robots.forEach(killedRobots => {
              const killedRobotIds: string[] = [];
              killedRobots.forEach(killedRobot => {
                killedRobotIds.push(killedRobot[1].robot_id);
              });
              killedRsByPlayer.set(playerName, killedRobotIds);
            });
          }
        }
      });
      this.killedRobotsByPlayer = killedRsByPlayer;
    }

  }
  updateFetchInterval(): void {
    if (this.fetchMode === 'automatic') {
      this.startAutomaticFetch();
    }
  }
  startAutomaticFetch(): void {
    this.stopAutomaticFetch(); // Stop current fetching process if any
    this.fetchSubscription = interval(this.fetchInterval * 1000).subscribe(() => {
      this.fetch();
    });
  }
  stopAutomaticFetch(): void {
    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
      this.fetchSubscription = null;
    }
  }
  fetch() {
    console.log('fetching');
    
    this.gameService.fetchGames().subscribe(game => {
      this.games = game;
      if (this.games[this.highlightedGame]?.round_states) {
        this.roundKeys = Array.from(this.games[this.highlightedGame].round_states.keys());
        const playerData = this.games[this.highlightedGame]?.round_states?.get(this.highlightedState)?.player_name_player_map;

        this.games[this.highlightedGame].participating_players.forEach(playerName => {
          if (playerData) {
            for (const player of Object.values<any>(playerData)) {
              const robotIds = [];
              for (const robotId of Object.keys(player.robots)) {
                robotIds.push(robotId);
              }
              this.playerRobotMap.set(playerName, robotIds);
            }
          }
        });
      }

      if (this.games[this.highlightedGame]?.participating_players && !this.colorsAssigned) {
        this.assignRandomColors();
        this.colorsAssigned = true;
      }
    });
  }
  getPlayerNameForRobot(robot: Robot): string | null {
    const playerData = this.games[this.highlightedGame]?.round_states?.get(this.highlightedState)?.player_name_player_map;

    if (playerData) {
      for (const player of Object.values(playerData)) {
        if (player.robots[robot.robot_id]) {
          return player.player_name;
        }
      }
    }

    return null;
  }
  getPlanetRobotsGradient(planetId: string): string {
    const robotsOnPlanet = this.getRobotsOnPlanet(planetId);
    const playerCounts = new Map<string, number>();
  
    robotsOnPlanet.forEach(robot => {
      const playerName = this.getPlayerNameForRobot(robot);
      if (playerName) {
        const currentCount = playerCounts.get(playerName) || 0;
        playerCounts.set(playerName, currentCount + 1);
      }
    });
  
    const totalRobots = robotsOnPlanet.length;
    const sortedPlayerCounts = new Map([...playerCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  
    const playerPercentiles = [];
    let cumulativePercentile = 0;
    for (const [playerName, robotCount] of sortedPlayerCounts) {
      const percentile = (robotCount / totalRobots) * 100;
      playerPercentiles.push({ name: playerName, percentile: cumulativePercentile });
      cumulativePercentile += percentile;
    }
  
    let gradientString = 'linear-gradient(to right';
    playerPercentiles.forEach((playerData, index) => {
      gradientString += `, ${this.playerColors.get(playerData.name)} ${playerData.percentile}%`;
      if (index < playerPercentiles.length - 1) {
        gradientString += ` ${playerPercentiles[index + 1].percentile}%`;
      }
    });
  
    return gradientString + ')';
  }

  getRobotsFromPlanetOfPlayer(planetId: string, playerName: string): Robot[] {
    const allRobotsOnPlanet = this.getRobotsOnPlanet(planetId);
    const playerData = this.games[this.highlightedGame]?.round_states?.get(this.highlightedState)?.player_name_player_map;
    if (playerData) {
      for (const player of Object.values(playerData)) {
        if (player.player_name === playerName) {
          return allRobotsOnPlanet.filter(robot => player.robots[robot.robot_id]);
        }
      }
    }

  }


  getContrastColor(color: string) {
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  }


  assignRandomColors() {
    const players = this.games[this.highlightedGame].participating_players;

    players.forEach(player => {
      const color = this.generateRandomColor();
      this.playerColors.set(player, color);
    });

  }
  setHighlightedGame(index) {
    this.highlightedGame = index;
  }
  generateRandomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    return hexColor;
  }
  ngOnChanges() {
    if (this.games[this.highlightedGame]?.round_states) {
      this.roundKeys = Array.from(this.games[this.highlightedGame].round_states.keys());
    }
  }
  setState(round: string) {
    this.highlightedState = round;
  }
  getRobotsOnPlanet(planetId: string): Robot[] {
    const robotsOnPlanet = [];
    const playerData = this.games[this.highlightedGame]?.round_states?.get(this.highlightedState)?.player_name_player_map;

    if (playerData) {
      for (const player of Object.values<any>(playerData)) {
        for (const robotId of Object.keys(player.robots)) {
          const robot = player.robots[robotId];
          if (robot.planet_id === planetId) {
            robotsOnPlanet.push(robot);
          }
        }
      }

    }

    return robotsOnPlanet;
  }

  getPlayerColor(robotId: string) {
    const playerData = this.games[this.highlightedGame]?.round_states?.get(this.highlightedState)?.player_name_player_map;
    if (playerData) {
      for (const player of Object.values(playerData)) {
        for (const robot of Object.keys(player.robots)) {
          if (robot === robotId) {
            return this.playerColors.get(player.player_name) || 'defaultColor';
          }
        }
      }
    }
  }

  formatAmount(amount) {
    if (amount >= 1000) {
      const thousands = Math.floor(amount / 1000);
      const hundred = Math.floor((amount % 1000) / 100);
      return `${thousands}.${hundred}k`;
    }
    return amount.toString();
  }


  getResourceImage(resource: string) {
    switch (resource) {
      case 'COAL':
        return '../assets/material_sprites/coal.png'
      case 'IRON':
        return '../assets/material_sprites/iron.png'
      case 'GEM':
        return '../assets/material_sprites/gem.png'
      case 'GOLD':
        return '../assets/material_sprites/gold.png'
      case 'PLATINUM':
        return '../assets/material_sprites/platin.png'
      case 'VOID':
        return '../assets/material_sprites/void.png'
      default:
        return ''
    }
  }

  ngOnDestroy(): void {
    this.gameSubscription.unsubscribe()
    this.stopAutomaticFetch(); 
  }
}

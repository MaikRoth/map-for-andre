import { Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../shared/game.service';
import { Subscription, interval } from 'rxjs';
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
  playerColors = new Map<string, string>();
  upgrade = ""
  private colorsAssigned: boolean = false;
  private gameSubscription: Subscription;

  constructor(private gameService: GameService) {

  }
  ngOnInit(): void {
      this.gameSubscription = interval(1000).subscribe(() => {
        this.gameService.fetchGames().subscribe(game => {
          this.games = game;
          if (this.games[this.highlightedGame]?.round_states) {
            this.roundKeys = Array.from(this.games[this.highlightedGame].round_states.keys());
          }

          if (this.games[this.highlightedGame]?.participating_players && !this.colorsAssigned) {
            this.assignRandomColors();
            this.colorsAssigned = true;
          }
        });
        this.extractAndSetKilledRobotIds()
      });
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
        if ((this.games[this.highlightedGame]?.round_states?.get(this.highlightedState)?.player_name_player_map[playerName])) {
          const player = currentRoundState.player_name_player_map[playerName];
          if (player) {
            player.killed_robots.forEach(killedRobots => {
              const killedRobotIds: string[] = [];
              killedRobots.forEach(killedRobot => {
                killedRobotIds.push(killedRobot[1].robot_id);
              });
              killedRsByPlayer.set(playerName, killedRobotIds);
            });
          }
        } else if (this.games[this.highlightedGame]?.round_states?.get(this.highlightedState)?.player_name_player_map.get(playerName)) {
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
  getPlanetRobotsGradient(planetId: string): string {
    const robotsOnPlanet = this.getRobotsOnPlanet(planetId);
    const playerCounts = new Map<string, number>();

    robotsOnPlanet.forEach(robot => {
      const count = playerCounts.get(robot.player_id) || 0;
      playerCounts.set(robot.player_id, count + 1);
    });

    const totalRobots = robotsOnPlanet.length;
    const colorStops: string[] = [];
    let accumulatedPercentage = 0;

    playerCounts.forEach((count, playerId) => {
      const color = this.playerColors.get(playerId);
      const percentage = (count / totalRobots) * 100;
      colorStops.push(`${color} ${accumulatedPercentage}%`, `${color} ${accumulatedPercentage + percentage}%`);
      accumulatedPercentage += percentage;
    });

    return `linear-gradient(to right, ${colorStops.join(', ')})`;
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
  getRobotsOnPlanet(planetId: string): any[] {
    const robotsOnPlanet = [];
    const playerData = this.games[this.highlightedGame]?.round_states?.get(this.highlightedState)?.player_name_player_map;

    if (playerData) {
      if (playerData instanceof Map) {
        playerData.forEach((player) => {
          for (const robotId of Object.keys(player.robots)) {
            const robot = player.robots[robotId];
            if (robot.planet_id === planetId) {
              robotsOnPlanet.push(robot);
            }
          }
        });
      } else if (typeof playerData === 'object') {
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
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  sendCommand(command: string, upgrade: string = "") {
    switch (command) {
      case "SELLING":
        const params4 = [
          {
            player_name: "TheLegend27",
            game_id: this.games[this.highlightedGame].game_id,
            command_type: command,
            command_object: {
              robot_id: `${this.games[this.highlightedGame].round_states[this.highlightedState].player_name_player_map.TheLegend27.robots.keys()[0]}`,

            }
          }
        ]
        this.gameService.sendCommand(this.games[this.highlightedGame].game_id, params4)
      case "BUYING":
        const params2 = [
          {
            player_name: "TheLegend27", game_id: this.games[this.highlightedGame].game_id,
            command_type: command,
            command_object: {
              item_name: "ROBOT",
              item_quantity: 1
            }
          }
        ]
        this.gameService.sendCommand(this.games[this.highlightedGame].game_id, params2)
      case "MINING":
        const params1 = [
          {
            player_name: "TheLegend27", game_id: this.games[this.highlightedGame].game_id,
            command_type: command,
            command_object: {
              robot_id: `${this.games[this.highlightedGame].round_states[this.highlightedState].player_name_player_map.TheLegend27.robots.keys()[0]}`,
              target_id: `${this.games[this.highlightedGame].round_states[this.highlightedState].player_name_player_map.TheLegend27.robots.keys()[0].planet_id}`
            }
          }
        ]
        this.gameService.sendCommand(this.games[this.highlightedGame].game_id, params1)
        break;
      case "MOVEMENT":
        const params3 = [
          {
            player_name: "TheLegend27", game_id: this.games[this.highlightedGame].game_id,
            command_type: command,
            command_object: {
              robot_id: `${this.games[this.highlightedGame].round_states[this.highlightedState].player_name_player_map.TheLegend27.robots.keys()[0]}`,
              target_id: `${this.games[this.highlightedGame].round_states[this.highlightedState].player_name_player_map.TheLegend27.robots.keys()[0].planet_id}`
            }
          }
        ]
        this.gameService.sendCommand(this.games[this.highlightedGame].game_id, params3)
        break;
      default:
        const params = [
          {
            player_name: "TheLegend27", game_id: this.games[this.highlightedGame].game_id,
            command_type: "REGENERATE",
            command_object: {
              robot_id: `${this.games[this.highlightedGame].round_states[this.highlightedState].player_name_player_map.TheLegend27.robots.keys()[0]}`,
            }
          }
        ]
        this.gameService.sendCommand(this.games[this.highlightedGame].game_id, params)
    }
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

  generateRandomGame(numPlayers = 2, numRobotsPerPlayer = 5, numRounds = 20): Game {
    const gameId = this.generateUUID();

    const participatingPlayers = Array.from({ length: numPlayers }, (_, i) => `Player_${i + 1}`);

    const roundStates: Map<string, RoundState> = new Map<string, RoundState>();
    for (let roundNum = 0; roundNum <= numRounds; roundNum++) {
      roundStates.set(roundNum.toString(), this.generateRandomRoundState(participatingPlayers, numRobotsPerPlayer, roundNum));
    }

    const game: Game = {
      game_id: gameId,
      participating_players: participatingPlayers,
      current_round: 1,
      max_rounds: numRounds,
      max_players: numPlayers,
      round_states: roundStates
    };

    return game;
  }

  generateRandomRoundState(players: string[], numRobots: number, roundNumber: number): RoundState {

    let playerNamePlayerMap: Map<string, Player> = new Map<string, Player>();
    players.forEach(playerName => {
      playerNamePlayerMap.set(playerName, {
        player_name: playerName,
        money: { amount: 400 },
        visited_planets: [],
        robots: this.generateRobots(numRobots),
        commands: {
          MOVEMENT: [],
          SELLING: [],
          BUYING: [],
          BATTLE: [],
          MINING: [],
          REGENERATE: [],
        },
        killed_robots: this.generateRandomKilledRobots("adolf", numRobots),
      });
    });

    const roundState: RoundState = {
      round_number: roundNumber,
      player_name_player_map: playerNamePlayerMap,
      map: {
        indices: undefined,
        planets: [this.generateRandomPlanets(10), this.generateRandomPlanets(10), this.generateRandomPlanets(10), this.generateRandomPlanets(10), this.generateRandomPlanets(10)]
      }
    };
    return roundState;
  }
  generateRandomKilledRobots(playerName: string, numRobots: number): Map<string, any[][]> {
    let killedRobots: Map<string, any[][]> = new Map<string, any[][]>();
    for (let i = 0; i < numRobots; i++) {
      const robotId = this.generateUUID();
      killedRobots.set(robotId, [["adolf", {
        robot_id: robotId,
        planet_id: this.generateUUID(),
        health: 0,//Math.floor(Math.random() * 3),
        energy: Math.floor(Math.random() * 20),
        levels: {
          health_level: "LEVEL0",
          damage_level: "LEVEL0",
          mining_level: "LEVEL0",
          mining_speed_level: "LEVEL0",
          energy_level: "LEVEL0",
          energy_regen_level: "LEVEL0",
          storage_level: "LEVEL0"
        },
        stats: {
          damage: 1,
          max_health: 1,
          max_energy: 1,
          energy_regen: 1,
          mining_speed: 1,
          max_storage: 1,
          mineable_resources: [],
        },
        inventory: {},
      }]]);
    }

    return killedRobots;
  }
  generateRandomPlanets(planets_amount: number): Planet[] {
    const planets: Planet[] = [];
    for (let i = 0; i < planets_amount; i++) {
      let planetId = "";
      if (i === 0) {
        planetId = "123";
      } else {
        planetId = this.generateUUID();
      }

      planets.push({
        planet_id: planetId,
        movement_difficulty: Math.floor(Math.random() * 10),
        neighbours: {
          [this.generateUUID()]: this.generateUUID(),
          [this.generateUUID()]: this.generateUUID(),
          [this.generateUUID()]: this.generateUUID(),
        },
        resources: [this.generateRandomResource(), Math.floor(Math.random() * 1000)]
      });
    }

    return planets;

  }
  generateRandomResource(): string {
    const resources = ['COAL', 'IRON', 'GEM', 'GOLD', 'PLATINUM'];
    return resources[Math.floor(Math.random() * resources.length)];
  }
  generateRobots(numRobots: number): any {
    const robots: Map<string, Robot> = new Map<string, Robot>();
    for (let i = 0; i < numRobots; i++) {
      const robotId = this.generateUUID();
      robots.set(robotId, {
        robot_id: robotId,
        planet_id: '123',
        health: 1,//Math.floor(Math.random() * 3),
        energy: Math.floor(Math.random() * 20),
        levels: {
          health_level: '',
          damage_level: '',
          mining_level: '',
          mining_speed_level: '',
          energy_level: '',
          energy_regen_level: '',
          storage_level: ''
        },
        inventory: {}
      });
    }

    return robots;
  }

  ngOnDestroy(): void {
    this.gameSubscription.unsubscribe()
  }
}

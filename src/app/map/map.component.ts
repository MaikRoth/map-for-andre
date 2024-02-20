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

  constructor(private gameService: GameService) {

  }
  ngOnInit(): void {
    this.gameSubscription = interval(8000).pipe(
      startWith(0)
    ).subscribe(() => {
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
      //this.extractAndSetKilledRobotIds()
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
  getPlanetRobotsGradient(planetId: string): string {
    const robotsOnPlanet = this.getRobotsOnPlanet(planetId);
    const playerCounts = new Map<string, number>();

    playerCounts.set("Player1", this.playerRobotMap.get("Player1").length);
    playerCounts.set("Player2", this.playerRobotMap.get("Player2").length);

    const totalRobots = robotsOnPlanet.length;
    const player1Count = playerCounts.get("Player1");
    const player2Count = playerCounts.get("Player2");
   
    return `linear-gradient(to right, ${this.playerColors.get("Player1")} ${(totalRobots / player1Count)*100}%, ${this.playerColors.get("Player2")} ${(totalRobots / player2Count)*100}%)`;
  }

  //generate a method to return a color that is different from the one that gets inputed so its high contrast
  getContrastColor(color: string){
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
  getRobotsOnPlanet(planetId: string): any[] {
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

  ngOnDestroy(): void {
    this.gameSubscription.unsubscribe()
  }
}

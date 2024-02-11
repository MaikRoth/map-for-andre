import { Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../shared/game.service';
import { Subscription, interval } from 'rxjs';
import { Game } from '../shared/types';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit, OnChanges, OnDestroy {

  games: Game[];
  highlightedGame: number | null = 0;
  isDropdownOpen: boolean = false;
  highlightedState: string = '0';
  roundKeys: string[] = [];
  playerColors = new Map<string, string>();
  upgrade = ""
  private colorsAssigned: boolean = false;
  private alwaysShowLast = true;
  private gameSubscription: Subscription;

  constructor(private gameService: GameService) {

  }
  ngOnInit(): void {
    this.gameSubscription = interval(1000).subscribe(() => {
      this.gameService.fetchGames().subscribe(game => {
        this.games = game;
        if (this.games[this.highlightedGame]?.round_states && this.alwaysShowLast) {
          this.roundKeys = Array.from(this.games[this.highlightedGame].round_states.keys());
        }

        if (this.games[this.highlightedGame]?.participating_players && !this.colorsAssigned) {
          this.assignRandomColors();
          this.colorsAssigned = true;
        }
      });
    });
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
      for (const player of Object.values(playerData)) {
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

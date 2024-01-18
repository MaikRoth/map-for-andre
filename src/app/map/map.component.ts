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
  highlightedGame : number | null = 0;
  isDropdownOpen: boolean = false;
  highlightedState: string = '0';
  roundKeys: string[] = [];
  playerColors = new Map<string, string>();
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
          this.highlightedState = (this.roundKeys.length-1).toString();
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
  setHighlightedGame(index){
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
  setActiveButton(round: string) {
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
  formatAmount(amount: number): string {
    if (amount >= 1000) {
      const formatted = (amount / 1000).toFixed(1);
      return `${formatted}k`;
    }
    return amount.toString();
  }
  getResourceImage(resource: string) {
    switch (resource) {
      case 'COAL':
        return '../assets/images/materials/coal.png'
      case 'IRON':
        return '../assets/images/materials/iron.png'
      case 'GEM':
        return '../assets/images/materials/gem.png'
      case 'GOLD':
        return '../assets/images/materials/gold.png'
      case 'PLATINUM':
        return '../assets/images/materials/platin.png'
      case 'VOID':
        return '../assets/images/materials/void.png'
      default:
        return ''
    }
  }

  ngOnDestroy(): void {
    this.gameSubscription.unsubscribe()
  }
}

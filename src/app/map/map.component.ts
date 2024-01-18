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

  game: Game;
  activeButton: string = "0";
  roundKeys: string[] = [];
  playerColors = new Map<string, string>();
  private colorsAssigned: boolean = false;

  private gameSubscription: Subscription;

  constructor(private gameService: GameService) {

  }
  ngOnInit(): void {
    this.gameSubscription = interval(1000).subscribe(() => {
      this.gameService.fetchGame().subscribe(game => {
        this.game = game;
        if (this.game?.round_states) {
          this.roundKeys = Array.from(this.game.round_states.keys());
        }

        if (this.game?.participating_players && !this.colorsAssigned) {
          this.assignRandomColors();
          this.colorsAssigned = true;
        }
      });
    });
  }
  assignRandomColors() {
    const players = this.game.participating_players;

    players.forEach(player => {
      const color = this.generateRandomColor();
      this.playerColors.set(player, color);
    });

  }
  generateRandomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    return hexColor;
  }
  ngOnChanges() {
    if (this.game?.round_states) {
      this.roundKeys = Array.from(this.game.round_states.keys());
    }
  }
  setActiveButton(round: string) {
    this.activeButton = round;
  }
  getRobotsOnPlanet(planetId: string): any[] {
    const robotsOnPlanet = [];
    const playerData = this.game?.round_states?.get(this.activeButton)?.player_name_player_map;
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
    const playerData = this.game?.round_states?.get(this.activeButton)?.player_name_player_map;
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

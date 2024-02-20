import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Player, Robot, RoundState } from '../shared/types';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrl: './player.component.css'
})
export class PlayerComponent implements OnChanges {

  @Input() playerData: Map<string, Player>;
  @Input() participatingPlayers: string[];
  @Input() colorMap: Map<string, string>;


  displayedPlayers: Player[] = [];
  

  ngOnChanges(changes: SimpleChanges) {
    if (changes.playerData && this.playerData) {
      if (!(this.playerData instanceof Map)) {
        this.playerData = new Map(Object.entries(this.playerData));
      }
    }
    if (this.participatingPlayers && this.playerData) {
      this.displayedPlayers = this.participatingPlayers
        .map(playerName => this.playerData.get(playerName))
        .filter(player => player !== undefined);
    }
  }
  mapValues(map: Map<any, any>): any[] {
    return Array.from(map.values());
  }

  getRobotValues(playerName: string): Robot[] {
    const player = this.playerData.get(playerName);
    
    if (player && typeof player.robots === "object") {
      return Object.values(player.robots);
    }
    return [];
  }

  copyToClipboard(text: string) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
  }

}

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Player, RoundState } from '../shared/types';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrl: './player.component.css'
})
export class PlayerComponent implements OnChanges{
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

  getRobotValues(robots: { [id: string]: any }): any[] {
    return Object.values(robots);
  }
  getKilledRobotData(player: any): [string, string][] {
    const killedRobots = player.killed_robots || {};
    const data: [string, string][] = [];
    
    for (const robotId in killedRobots) {
      if (killedRobots.hasOwnProperty(robotId)) {
        const enemyRobotId = killedRobots[robotId][1];
        data.push([robotId, enemyRobotId[1].robot_id]);
      }
    }
    
    return data;
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

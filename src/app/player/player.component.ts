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
  private playersRobotsCache: { [playerName: string]: { orderedRobots: any[], robotsCache: { [robotId: string]: any } } } = {};
  

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
    this.updatePlayersRobotsCache();

  }
  mapValues(map: Map<any, any>): any[] {
    return Array.from(map.values());
  }

  updatePlayersRobotsCache(): void {
    this.playerData.forEach((player, playerName) => {
      if (!this.playersRobotsCache[playerName]) {
        this.playersRobotsCache[playerName] = { orderedRobots: [], robotsCache: {} };
      }

      const playerRobotsCache = this.playersRobotsCache[playerName].robotsCache;
      const orderedRobots = this.playersRobotsCache[playerName].orderedRobots;

      Object.entries(player.robots || {}).forEach(([robotId, robot]) => {
        if (!playerRobotsCache[robotId]) {
          playerRobotsCache[robotId] = robot;
          orderedRobots.push(robot);
        } else {
          playerRobotsCache[robotId] = robot;
        }
      });

    });
  }

  getRobotValues(playerName: string): any[] {
    if (this.playersRobotsCache[playerName]) {
      return this.playersRobotsCache[playerName].orderedRobots.filter(robot => robot.health > 0);
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

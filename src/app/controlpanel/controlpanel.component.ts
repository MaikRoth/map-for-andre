import { Component } from '@angular/core';
import { GameService } from '../shared/game.service';

@Component({
  selector: 'app-controlpanel',
  templateUrl: './controlpanel.component.html',
  styleUrl: './controlpanel.component.css'
})
export class ControlpanelComponent {

  maxPlayer;
  maxRounds;

  constructor(private gameService: GameService){}

  createGame(maxPlayers, maxRounds){
    const params = {
      max_players: maxPlayers,
      max_rounds: maxRounds
    }
    this.gameService.createGame(params)
  }
}

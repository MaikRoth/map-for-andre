import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Game, RoundState } from './types';
import { BehaviorSubject, Observable, interval, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private endpoint = 'http://localhost:8080/games';

  constructor(private http: HttpClient) { }

  fetchGame(): Observable<Game> {
    return this.http.get<Game>(this.endpoint).pipe(
      map((response: any) => {
        const gameData = {
          current_round: response[0].current_round,
          game_id: response[0].game_id,
          max_players: response[0].max_players,
          max_rounds: response[0].max_rounds,
          participating_players: response[0].participating_players,
          round_states: new Map<string, RoundState>(
            Object.entries(response[0].round_states).map(([key, value]) => [key, value as RoundState])
          )
        } as Game;
        return gameData;
      })
    );
  }

  createGame(params){
    this.http.post(this.endpoint,params).subscribe(
      response => {
        console.log(response)
      },
      error => {
        console.log(error);
        
      }
    )
  }

}

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

  fetchGames(): Observable<Game[]> {
    return this.http.get<Game[]>(this.endpoint).pipe(
      map((response: any[]) => {
        const games: Game[] = response.map((gameData: any) => ({
          current_round: gameData.current_round,
          game_id: gameData.game_id,
          max_players: gameData.max_players,
          max_rounds: gameData.max_rounds,
          participating_players: gameData.participating_players,
          round_states: new Map<string, RoundState>(
            Object.entries(gameData.round_states).map(([key, value]) => [key, value as RoundState])
          )
        }));
        return games;
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

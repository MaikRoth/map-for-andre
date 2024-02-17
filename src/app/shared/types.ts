
export type Game =
    {
        current_round: number,
        game_id: string,
        max_players: number,
        max_rounds: number,
        participating_players: string[],
        round_states: Map<string, RoundState>
    }

export type RoundState = {
    round_number: number;
    player_name_player_map: Map<string, Player>
    map: MapState
}

export type MapState = {
    indices: Map<string, number[]>,
    planets: Planet[][]
}

export type Planet = {
    movement_difficulty: number,
    neighbours: { [key: string]: string },
    planet_id: string,
    resources: [string, number]
}

export type Player = {
    player_name: string,
    money: { amount: number },
    visited_planets: any[]
    robots: any[];
    commands: Commands,
    killed_robots: {}
}

export type Commands = {
    SELLING: any[],
    MINING: any[],
    BUYING: any[],
    BATTLE: any[],
    REGENERATE: any[],
    MOVEMENT: any[],
}

export type Robot = {
    robot_id: string,
    planet_id: string,
    health: number,
    energy: number,
    levels: {
        health_level: string,
        damage_level: string,
        mining_level: string,
        mining_speed_level: string,
        energy_level: string,
        energy_regen_level: string,
        storage_level: string
    },
    inventory: any
}

// src/types/index.ts

export interface GameItem {
    name: string;
    img: string;
}

export interface GameData {
    characters: GameItem[];
    weapons: GameItem[];
    locations: GameItem[];
}

export interface Player {
    id: string;
    name: string;
    avatar: string;
    type: 'human' | 'cpu';
    hand: string[];
    isEliminated: boolean;
}

export interface Envelope {
    character: string;
    weapon: string;
    location: string;
}
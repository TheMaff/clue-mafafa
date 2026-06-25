// src/store/gameEngine.ts
import { create } from 'zustand';
import type { GameData, Player, Envelope } from '../types';
import gameDataJson from '../data/game-data.json';

// Casteamos el JSON para que TypeScript confíe en su estructura
const rawData = gameDataJson as GameData;

// Nuestro confiable algoritmo Fisher-Yates
const shuffleArray = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// Definimos qué hace y qué guarda nuestro motor
interface GameState {
    players: Player[];
    envelope: Envelope | null;
    turnIndex: number;
    isGameActive: boolean;

    // Acciones
    startGame: (humans: { name: string; avatar: string }[], cpus: { name: string; avatar: string }[]) => void;
    nextTurn: () => void;
    eliminatePlayer: (playerId: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    // Estado inicial
    players: [],
    envelope: null,
    turnIndex: 0,
    isGameActive: false,

    // Iniciar el juego: barajar y repartir
    startGame: (humans, cpus) => {
        // 1. Barajar cada mazo por separado
        const shuffledCharacters = shuffleArray(rawData.characters);
        const shuffledWeapons = shuffleArray(rawData.weapons);
        const shuffledLocations = shuffleArray(rawData.locations);

        // 2. Separar el sobre confidencial (1 carta de cada mazo)
        const secretEnvelope: Envelope = {
            character: shuffledCharacters.pop()!.name,
            weapon: shuffledWeapons.pop()!.name,
            location: shuffledLocations.pop()!.name,
        };

        // 3. Unir y barajar el gran mazo restante
        const remainingDeck = [
            ...shuffledCharacters.map(c => c.name),
            ...shuffledWeapons.map(w => w.name),
            ...shuffledLocations.map(l => l.name),
        ];
        const shuffledDeck = shuffleArray(remainingDeck);

        // 4. Inscribir a todos los jugadores
        const allPlayers: Player[] = [];

        humans.forEach((h, index) => {
            allPlayers.push({ id: `human-${index}`, name: h.name, avatar: h.avatar, type: 'human', hand: [], isEliminated: false });
        });

        cpus.forEach((c, index) => {
            allPlayers.push({ id: `cpu-${index}`, name: c.name, avatar: c.avatar, type: 'cpu', hand: [], isEliminated: false });
        });

        // 5. Repartir el mazo como si fuera un crupier real
        shuffledDeck.forEach((cardName, index) => {
            const playerToReceive = allPlayers[index % allPlayers.length];
            playerToReceive.hand.push(cardName);
        });

        // 6. Arrancar la partida
        set({
            players: allPlayers,
            envelope: secretEnvelope,
            turnIndex: 0,
            isGameActive: true,
        });
    },

    // Pasar al siguiente turno omitiendo eliminados
    nextTurn: () => {
        const { players, turnIndex } = get();
        let nextIndex = turnIndex;

        do {
            nextIndex = (nextIndex + 1) % players.length;
        } while (players[nextIndex].isEliminated);

        set({ turnIndex: nextIndex });
    },

    // Marcar a un jugador como eliminado (por hacer una acusación final falsa)
    eliminatePlayer: (playerId) => {
        const { players } = get();
        const updatedPlayers = players.map(p =>
            p.id === playerId ? { ...p, isEliminated: true } : p
        );
        set({ players: updatedPlayers });
    }
}));
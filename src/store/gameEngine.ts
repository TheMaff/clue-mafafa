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
    notes: Record<string, Record<string, boolean>>;

    // Acciones
    startGame: (humans: { name: string; avatar: string }[], cpus: { name: string; avatar: string }[]) => void;
    nextTurn: () => void;
    eliminatePlayer: (playerId: string) => void;
    // Le pasamos el ID del jugador que está tachando la nota
    toggleNote: (playerId: string, cardName: string) => void;

    // Guardará quién te mostró qué carta, o 'no-match' si nadie tiene nada
    hypothesisResult: { refuterName: string; cardShown: string } | 'no-match' | null;
    winner: Player | null; // Guardará al jugador que gane

    // Acciones
    checkHypothesis: (suspect: string, weapon: string, location: string) => void;
    clearHypothesisResult: () => void;
    makeAccusation: (suspect: string, weapon: string, location: string) => boolean;
}

export const useGameStore = create<GameState>((set, get) => ({
    // Estado inicial
    players: [],
    envelope: null,
    turnIndex: 0,
    isGameActive: false,
    notes: {},
    hypothesisResult: null,
    winner: null,

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

        // Autotachar las cartas en la libreta para los jugadores humanos
        const initialNotes: Record<string, Record<string, boolean>> = {};
        allPlayers.forEach(player => {
            // Creamos una libreta en blanco para CADA jugador
            initialNotes[player.id] = {};
            if (player.type === 'human') {
                player.hand.forEach(card => {
                    initialNotes[player.id][card] = true;
                });
            }
        });

        // 6. Arrancar la partida
        set({
            players: allPlayers,
            envelope: secretEnvelope,
            turnIndex: 0,
            isGameActive: true,
            notes: initialNotes,
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
    },

    toggleNote: (playerId, cardName) => {
        const { notes } = get();
        const playerNotes = notes[playerId] || {}; // Obtenemos la libreta de ese jugador

        set({
            notes: {
                ...notes,
                [playerId]: {
                    ...playerNotes,
                    [cardName]: !playerNotes[cardName] // Invierte el valor actual solo para él
                }
            }
        });
    },

    checkHypothesis: (suspect, weapon, location) => {
        const { players, turnIndex } = get();
        const cardsToCheck = [suspect, weapon, location];

        let foundMatch = false;

        // Empezamos a preguntar por el jugador a nuestra izquierda
        let currentIndex = (turnIndex + 1) % players.length;

        // Iteramos por toda la mesa hasta volver a nosotros mismos
        while (currentIndex !== turnIndex) {
            const rival = players[currentIndex];

            if (!rival.isEliminated) {
                // Vemos si el rival tiene alguna de las cartas sugeridas
                const matchingCards = rival.hand.filter(card => cardsToCheck.includes(card));

                if (matchingCards.length > 0) {
                    // Si tiene, elige una al azar para mostrar (automatizado para agilizar el juego)
                    const cardToShow = matchingCards[Math.floor(Math.random() * matchingCards.length)];

                    set({ hypothesisResult: { refuterName: rival.name, cardShown: cardToShow } });
                    foundMatch = true;
                    break; // Rompemos el ciclo, ya nadie más debe mostrar cartas
                }
            }
            // Pasamos al siguiente jugador
            currentIndex = (currentIndex + 1) % players.length;
        }

        // Si dimos toda la vuelta y nadie tiene nada
        if (!foundMatch) {
            set({ hypothesisResult: 'no-match' });
        }
    },

    clearHypothesisResult: () => set({ hypothesisResult: null }),

    makeAccusation: (suspect, weapon, location) => {
        const { envelope, players, turnIndex, eliminatePlayer } = get();
        if (!envelope) return false;

        // Comprobamos si las 3 coinciden exactamente con el sobre
        const isCorrect =
            suspect === envelope.character &&
            weapon === envelope.weapon &&
            location === envelope.location;

        if (isCorrect) {
            set({ winner: players[turnIndex] });
            return true;
        } else {
            eliminatePlayer(players[turnIndex].id);
            return false;
        }
    },
}));
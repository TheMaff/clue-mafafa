// src/store/gameEngine.ts
import { create } from 'zustand';
import type { GameData, Player, Envelope as SecretEnvelope } from '../types'; // Mantenemos tus tipos originales
import gameDataJson from '../data/game-data.json';
import { db } from '../lib/firebase';
// MIRA AQUÍ: Renombramos set y get de Firebase para que no peleen con Zustand
import { ref, set as firebaseSet, get as firebaseGet, onValue, update, child } from 'firebase/database';

const rawData = gameDataJson as GameData;

const shuffleArray = <T>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export interface GameState {
    players: Player[];
    envelope: SecretEnvelope | null;
    turnIndex: number;
    isGameActive: boolean;
    notes: Record<string, Record<string, boolean>>;
    // Guardará quién te mostró qué carta, o 'no-match' si nadie tiene nada
    hypothesisResult: { refuterName: string; cardShown: string } | 'no-match' | null;
    winner: Player | null; // Guardará al jugador que gane

    // --- NUEVOS ESTADOS MULTIJUGADOR ---
    roomId: string | null;
    isHost: boolean;
    remotePlayers: any[]; // Lista temporal de jugadores en la sala de espera
    myPlayerId: string | null;

    // Acciones
    startGame: (humans: { name: string; avatar: string }[], cpus: { name: string; avatar: string }[]) => void;
    nextTurn: () => void;
    eliminatePlayer: (playerId: string) => void;
    toggleNote: (playerId: string, cardName: string) => void;
    checkHypothesis: (suspect: string, weapon: string, location: string) => void;
    clearHypothesisResult: () => void;
    makeAccusation: (suspect: string, weapon: string, location: string) => boolean;

    // --- NUEVAS ACCIONES MULTIJUGADOR ---
    createMultiplayerRoom: (hostName: string, hostAvatar: string) => Promise<string>;
    joinMultiplayerRoom: (roomCode: string, guestName: string, guestAvatar: string) => Promise<boolean>;
    listenToRoom: (roomCode: string) => void;
    leaveRoom: () => void;
    startMultiplayerGame: () => Promise<void>;
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

    // Estados multijugador iniciales
    roomId: null,
    isHost: false,
    remotePlayers: [],
    myPlayerId: null,

    // Iniciar el juego: barajar y repartir
    startGame: (humans, cpus) => {
        // 1. Barajar cada mazo por separado
        const shuffledCharacters = shuffleArray(rawData.characters);
        const shuffledWeapons = shuffleArray(rawData.weapons);
        const shuffledLocations = shuffleArray(rawData.locations);

        // 2. Separar el sobre confidencial (1 carta de cada mazo)
        const secretEnvelope: SecretEnvelope = {
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

    // --- LÓGICA MULTIJUGADOR CON FIREBASE ---

    createMultiplayerRoom: async (hostName, hostAvatar) => {
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        const myId = `player_${Math.random().toString(36).substring(2, 9)}`;

        const roomRef = ref(db, `rooms/${roomCode}`);

        // Usamos firebaseSet en lugar de set
        await firebaseSet(roomRef, {
            status: 'waiting',
            hostId: myId,
            players: {
                [myId]: { name: hostName, avatar: hostAvatar, isHost: true }
            }
        });

        // Este es el set normal de Zustand, ¡ahora conviven en paz!
        set({ roomId: roomCode, isHost: true, myPlayerId: myId });
        get().listenToRoom(roomCode);
        return roomCode;
    },

    joinMultiplayerRoom: async (roomCode, guestName, guestAvatar) => {
        const roomRef = ref(db, `rooms/${roomCode}`);

        // Usamos firebaseGet en lugar de get
        const snapshot = await firebaseGet(roomRef);

        if (snapshot.exists() && snapshot.val().status === 'waiting') {
            const myId = `player_${Math.random().toString(36).substring(2, 9)}`;

            await update(child(roomRef, 'players'), {
                [myId]: { name: guestName, avatar: guestAvatar, isHost: false }
            });

            set({ roomId: roomCode, isHost: false, myPlayerId: myId });
            get().listenToRoom(roomCode);
            return true;
        }
        return false;
    },

    listenToRoom: (roomCode) => {
        const roomRef = ref(db, `rooms/${roomCode}`);

        onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();

                const playersArray = Object.keys(data.players || {}).map(key => ({
                    id: key,
                    ...data.players[key]
                }));

                // Actualizamos la lista de espera
                set({ remotePlayers: playersArray });

                // EL GATILLO MÁGICO: Si el Host cambió el estado a 'playing', arrancamos el juego
                if (data.status === 'playing' && !get().isGameActive) {
                    const myId = get().myPlayerId;
                    const myPlayer = playersArray.find(p => p.id === myId);

                    // Preparamos la libreta privada del jugador con sus propias cartas ya tachadas
                    const initialNotes: Record<string, Record<string, boolean>> = {};
                    initialNotes[myId!] = {};

                    if (myPlayer && myPlayer.hand) {
                        myPlayer.hand.forEach((card: string) => {
                            initialNotes[myId!][card] = true;
                        });
                    }

                    // Inyectamos el estado de Firebase a nuestro Zustand local
                    set({
                        players: playersArray, // Ahora los jugadores oficiales son los de Firebase
                        envelope: data.envelope,
                        turnIndex: data.turnIndex || 0,
                        isGameActive: true, // Esto oculta el CoverScreen y muestra el Board
                        notes: initialNotes
                    });
                }
            }
        });
    },

    startMultiplayerGame: async () => {
        const { roomId, remotePlayers } = get();
        if (!roomId) return;

        // 1. Preparamos los mazos
        const suspects = shuffleArray([...gameDataJson.characters.map(c => c.name)]);
        const weapons = shuffleArray([...gameDataJson.weapons.map(w => w.name)]);
        const locations = shuffleArray([...gameDataJson.locations.map(l => l.name)]);

        // 2. Extraemos el sobre secreto
        const secretEnvelope = {
            character: suspects.pop()!,
            weapon: weapons.pop()!,
            location: locations.pop()!
        };

        // 3. Juntamos lo que sobra y barajamos todo
        const remainingCards = shuffleArray([...suspects, ...weapons, ...locations]);

        // 4. Clonamos a los jugadores y les repartimos equitativamente
        const playersWithHands = remotePlayers.map(p => ({ ...p, hand: [] as string[], type: 'human' }));

        let currentPlayerIndex = 0;
        while (remainingCards.length > 0) {
            playersWithHands[currentPlayerIndex].hand.push(remainingCards.pop()!);
            currentPlayerIndex = (currentPlayerIndex + 1) % playersWithHands.length;
        }

        // 5. Convertimos el array de vuelta a objeto para guardarlo ordenado en Firebase
        const firebasePlayers = playersWithHands.reduce((acc, player) => {
            acc[player.id] = player;
            return acc;
        }, {} as Record<string, any>);

        // 6. Impactamos la base de datos (Esto disparará el onValue de todos los conectados)
        const roomRef = ref(db, `rooms/${roomId}`);
        await update(roomRef, {
            status: 'playing',
            envelope: secretEnvelope,
            players: firebasePlayers,
            turnIndex: 0
        });
    },

    leaveRoom: () => {
    set({ roomId: null, isHost: false, remotePlayers: [], myPlayerId: null });
    // Idealmente aquí también borraríamos nuestro jugador de Firebase, pero lo mantendremos simple
    }
}));
// src/store/gameEngine.ts
import { create } from 'zustand';
import type { GameData, Player, Envelope as SecretEnvelope } from '../types';
import gameDataJson from '../data/game-data.json';
import { db } from '../lib/firebase';
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
    hypothesisResult: any;
    winner: Player | null;
    roomId: string | null;
    isHost: boolean;
    remotePlayers: any[];
    myPlayerId: string | null;

    startGame: (humanPlayers: Partial<Player>[], cpuPlayers: Partial<Player>[]) => void;
    nextTurn: () => Promise<void>;
    eliminatePlayer: (playerId: string) => void;
    toggleNote: (playerId: string, cardName: string) => void;
    checkHypothesis: (suspect: string, weapon: string, location: string) => Promise<void>;
    clearHypothesisResult: () => Promise<void>;
    makeAccusation: (suspect: string, weapon: string, location: string) => boolean;
    createMultiplayerRoom: (hostName: string, hostAvatar: string) => Promise<string>;
    joinMultiplayerRoom: (roomCode: string, guestName: string, guestAvatar: string) => Promise<boolean>;
    startMultiplayerGame: () => Promise<void>;
    listenToRoom: (roomCode: string) => void;
    leaveRoom: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    players: [],
    envelope: null,
    turnIndex: 0,
    isGameActive: false,
    notes: {},
    hypothesisResult: null,
    winner: null,
    roomId: null,
    isHost: false,
    remotePlayers: [],
    myPlayerId: null,

    startGame: (humanPlayers, cpuPlayers) => {
        // Modo solitario clásico offline
        const allPlayers = [...humanPlayers, ...cpuPlayers].map((p, idx) => ({
            id: p.id || `player_${idx}`,
            name: p.name!,
            avatar: p.avatar!,
            type: p.type || 'cpu',
            hand: [],
            isEliminated: false
        })) as Player[];

        const suspects = shuffleArray(rawData.characters.map(c => c.name));
        const weapons = shuffleArray(rawData.weapons.map(w => w.name));
        const locations = shuffleArray(rawData.locations.map(l => l.name));

        const secretEnvelope = { character: suspects.pop()!, weapon: weapons.pop()!, location: locations.pop()! };
        const remainingCards = shuffleArray([...suspects, ...weapons, ...locations]);

        let currentPlayerIndex = 0;
        while (remainingCards.length > 0) {
            allPlayers[currentPlayerIndex].hand.push(remainingCards.pop()!);
            currentPlayerIndex = (currentPlayerIndex + 1) % allPlayers.length;
        }

        const initialNotes: Record<string, Record<string, boolean>> = {};
        allPlayers.forEach(player => {
            initialNotes[player.id] = {};
            if (player.type === 'human') {
                player.hand.forEach(card => { initialNotes[player.id][card] = true; });
            }
        });

        set({ players: allPlayers, envelope: secretEnvelope, turnIndex: 0, isGameActive: true, notes: initialNotes, roomId: null });
    },

    nextTurn: async () => {
        const { roomId, turnIndex, players } = get();
        const nextIdx = (turnIndex + 1) % players.length;

        if (roomId) {
            // Sincronización remota: actualizamos el turno y limpiamos la sospecha anterior en la nube
            await update(ref(db, `rooms/${roomId}`), {
                turnIndex: nextIdx,
                hypothesisResult: null
            });
        } else {
            set({ turnIndex: nextIdx, hypothesisResult: null });
        }
    },

    eliminatePlayer: (playerId) => {
        set((state) => ({
            players: state.players.map(p => p.id === playerId ? { ...p, isEliminated: true } : p)
        }));
    },

    toggleNote: (playerId, cardName) => {
        set((state) => {
            const playerNotes = state.notes[playerId] || {};
            return {
                notes: {
                    ...state.notes,
                    [playerId]: {
                        ...playerNotes,
                        [cardName]: !playerNotes[cardName]
                    }
                }
            };
        });
    },

    checkHypothesis: async (suspect, weapon, location) => {
        const { roomId, players, turnIndex } = get();
        const cardsToCheck = [suspect, weapon, location];
        let result: any = 'no-match';

        let currentIndex = (turnIndex + 1) % players.length;
        while (currentIndex !== turnIndex) {
            const rival = players[currentIndex];
            if (!rival.isEliminated) {
                const matchingCards = rival.hand.filter(card => cardsToCheck.includes(card));
                if (matchingCards.length > 0) {
                    const cardToShow = matchingCards[Math.floor(Math.random() * matchingCards.length)];
                    result = { refuterName: rival.name, cardShown: cardToShow, refuterId: rival.id };
                    break;
                }
            }
            currentIndex = (currentIndex + 1) % players.length;
        }

        if (roomId) {
            // Subimos el resultado del interrogatorio a Firebase para que todos los dispositivos lo vean
            await update(ref(db, `rooms/${roomId}`), { hypothesisResult: result });
        } else {
            set({ hypothesisResult: result });
        }
    },

    clearHypothesisResult: async () => {
        const { roomId } = get();
        if (roomId) {
            await update(ref(db, `rooms/${roomId}`), { hypothesisResult: null });
        } else {
            set({ hypothesisResult: null });
        }
    },

    makeAccusation: (suspect, weapon, location) => {
        const { envelope, players, turnIndex } = get();
        if (!envelope) return false;

        const isCorrect = suspect === envelope.character && weapon === envelope.weapon && location === envelope.location;

        if (isCorrect) {
            set({ winner: players[turnIndex] });
            return true;
        } else {
            get().eliminatePlayer(players[turnIndex].id);
            return false;
        }
    },

    createMultiplayerRoom: async (hostName, hostAvatar) => {
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        const myId = `player_${Math.random().toString(36).substring(2, 9)}`;

        const roomRef = ref(db, `rooms/${roomCode}`);
        await firebaseSet(roomRef, {
            status: 'waiting',
            hostId: myId,
            players: {
                [myId]: { id: myId, name: hostName, avatar: hostAvatar, isHost: true, hand: [], type: 'human' }
            }
        });

        set({ roomId: roomCode, isHost: true, myPlayerId: myId });
        get().listenToRoom(roomCode);
        return roomCode;
    },

    joinMultiplayerRoom: async (roomCode, guestName, guestAvatar) => {
        const roomRef = ref(db, `rooms/${roomCode}`);
        const snapshot = await firebaseGet(roomRef);

        if (snapshot.exists() && snapshot.val().status === 'waiting') {
            const myId = `player_${Math.random().toString(36).substring(2, 9)}`;
            await update(child(roomRef, 'players'), {
                [myId]: { id: myId, name: guestName, avatar: guestAvatar, isHost: false, hand: [], type: 'human' }
            });

            set({ roomId: roomCode, isHost: false, myPlayerId: myId });
            get().listenToRoom(roomCode);
            return true;
        }
        return false;
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


    listenToRoom: (roomCode) => {
        const roomRef = ref(db, `rooms/${roomCode}`);

        onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();

                const playersArray = Object.keys(data.players || {}).map(key => ({
                    ...data.players[key]
                }));

                set({ remotePlayers: playersArray });

                if (data.status === 'playing') {
                    const myId = get().myPlayerId;
                    const isGameStarting = !get().isGameActive;

                    // FIX LIBRETA: Solo inicializamos las notas si la partida está arrancando de cero.
                    // Si ya estaba activa, preservamos de forma estricta las anotaciones locales existentes.
                    let currentNotes = get().notes;

                    if (isGameStarting && myId) {
                        const myPlayer = playersArray.find(p => p.id === myId);
                        const playerNotes: Record<string, boolean> = {};
                        if (myPlayer && myPlayer.hand) {
                            myPlayer.hand.forEach((card: string) => { playerNotes[card] = true; });
                        }
                        currentNotes = { ...currentNotes, [myId]: playerNotes };
                    }

                    set({
                        players: playersArray,
                        envelope: data.envelope,
                        turnIndex: data.turnIndex || 0,
                        hypothesisResult: data.hypothesisResult !== undefined ? data.hypothesisResult : null,
                        winner: data.winner || null,
                        isGameActive: true,
                        notes: currentNotes
                    });
                }
            }
        });
    },

    leaveRoom: () => {
        set({ roomId: null, isHost: false, remotePlayers: [], myPlayerId: null, isGameActive: false });
    }
}));
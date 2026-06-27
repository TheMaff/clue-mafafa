// src/components/CPUController.tsx
import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameEngine';
import gameData from '../data/game-data.json';

export default function CPUController() {
    // SOLO nos suscribimos al cambio de turno.
    const turnIndex = useGameStore((state) => state.turnIndex);

    const [cpuMessage, setCpuMessage] = useState<string | null>(null);
    const turnLock = useRef<number>(-1);

    useEffect(() => {
        // Leemos los datos fresquitos usando getState() para no crear suscripciones que rompan el Effect
        const state = useGameStore.getState();
        const currentPlayer = state.players[turnIndex];

        if (!currentPlayer || currentPlayer.type !== 'cpu' || currentPlayer.isEliminated) {
            setCpuMessage(null);
            return;
        }

        if (turnLock.current === turnIndex) return;
        turnLock.current = turnIndex;

        let isMounted = true;

        const playTurn = async () => {
            setCpuMessage(`🤖 ${currentPlayer.name} está revisando su libreta...`);
            await new Promise(r => setTimeout(r, 2500));
            if (!isMounted) return;

            // Leemos el estado nuevamente justo en el momento de actuar
            const currentState = useGameStore.getState();
            const myNotes = currentState.notes[currentPlayer.id] || {};

            const availableSuspects = gameData.characters.filter(c => !myNotes[c.name]).map(c => c.name);
            const availableWeapons = gameData.weapons.filter(w => !myNotes[w.name]).map(w => w.name);
            const availableLocations = gameData.locations.filter(l => !myNotes[l.name]).map(l => l.name);

            const suspect = availableSuspects.length > 0
                ? availableSuspects[Math.floor(Math.random() * availableSuspects.length)]
                : gameData.characters[0].name;

            const weapon = availableWeapons.length > 0
                ? availableWeapons[Math.floor(Math.random() * availableWeapons.length)]
                : gameData.weapons[0].name;

            const location = availableLocations.length > 0
                ? availableLocations[Math.floor(Math.random() * availableLocations.length)]
                : gameData.locations[0].name;

            setCpuMessage(`🗣️ ${currentPlayer.name} entra a ${location} y sospecha de ${suspect} con ${weapon}.`);
            await new Promise(r => setTimeout(r, 4500));
            if (!isMounted) return;

            const cardsToCheck = [suspect, weapon, location];
            let foundMatch = false;

            // Obtenemos los players directamente desde el motor para tener la info en tiempo real
            const currentPlayers = useGameStore.getState().players;
            let checkIndex = (turnIndex + 1) % currentPlayers.length;

            while (checkIndex !== turnIndex) {
                const rival = currentPlayers[checkIndex];

                if (!rival.isEliminated) {
                    const matchingCards = rival.hand.filter(c => cardsToCheck.includes(c));

                    if (matchingCards.length > 0) {
                        const cardToShow = matchingCards[Math.floor(Math.random() * matchingCards.length)];

                        // ESTO YA NO ABORTARÁ EL EFECTO:
                        useGameStore.getState().toggleNote(currentPlayer.id, cardToShow);

                        if (rival.type === 'human') {
                            setCpuMessage(`🤫 Tú le mostraste en secreto una carta a ${currentPlayer.name}.`);
                        } else {
                            setCpuMessage(`🤫 ${rival.name} le mostró en secreto una carta a ${currentPlayer.name}.`);
                        }

                        foundMatch = true;
                        break;
                    }
                }
                checkIndex = (checkIndex + 1) % currentPlayers.length;
            }

            if (!foundMatch) {
                setCpuMessage(`😱 Nadie pudo desmentir la sospecha de ${currentPlayer.name}...`);
            }

            await new Promise(r => setTimeout(r, 3500));
            if (!isMounted) return;

            setCpuMessage(null);
            // Avanzamos turno directamente desde el estado
            useGameStore.getState().nextTurn();
        };

        playTurn();

        return () => { isMounted = false; };
    }, [turnIndex]); // <--- La clave: el effect solo depende del índice del turno

    if (!cpuMessage) return null;

    return (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-blue-900/95 border-2 border-blue-400 text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.4)] z-[100] animate-fade-in-up max-w-md w-11/12 text-center pointer-events-none">
            <p className="font-bold text-sm md:text-base leading-relaxed">{cpuMessage}</p>
        </div>
    );
}
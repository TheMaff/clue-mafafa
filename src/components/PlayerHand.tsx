// src/components/PlayerHand.tsx
import { useState } from 'react';
import { useGameStore } from '../store/gameEngine';
import Card from './Card';
import gameData from '../data/game-data.json';

export default function PlayerHand() {
    const players = useGameStore((state) => state.players);
    const turnIndex = useGameStore((state) => state.turnIndex);
    const myPlayerId = useGameStore((state) => state.myPlayerId);

    const [isExpanded, setIsExpanded] = useState(false);

    const currentPlayer = players[turnIndex];

    // FIX: Si estamos online, mostramos TU jugador. Si es solitario, mostramos el actual.
    const me = myPlayerId ? players.find(p => p.id === myPlayerId) : currentPlayer;

    const getCardDetails = (cardName: string) => {
        let match = gameData.characters.find(c => c.name === cardName);
        if (match) return { category: 'character' as const, img: match.img };
        match = gameData.weapons.find(w => w.name === cardName);
        if (match) return { category: 'weapon' as const, img: match.img };
        match = gameData.locations.find(l => l.name === cardName);
        if (match) return { category: 'location' as const, img: match.img };
        return { category: 'character' as const, img: '' };
    };

    if (!me || me.type !== 'human') return null;

    // Calculamos si es tu turno para resaltar la UI
    const isMyTurn = myPlayerId ? currentPlayer?.id === myPlayerId : currentPlayer?.type === 'human';

    return (
        // FIX Z-Index: Bajamos la barra a z-40
        <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E24] border-t-4 border-[#2C2D33] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.5)] z-40">
            <div className="max-w-5xl mx-auto p-4">

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <img
                            src={`/assets/${currentPlayer?.avatar}`}
                            alt="Avatar Turno"
                            className={`w-12 h-12 rounded-full border-2 ${isMyTurn ? 'border-green-500' : 'border-gray-500 opacity-60'} bg-gray-800`}
                        />
                        <div>
                            <p className={`text-sm font-bold ${isMyTurn ? 'text-green-400' : 'text-gray-400'}`}>
                                {isMyTurn ? '¡Es tu turno!' : `Turno de: ${currentPlayer?.name}`}
                            </p>
                            <p className="text-lg font-bold text-white">{me.name} (Tú)</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded-xl text-xs font-bold uppercase text-white tracking-widest flex items-center gap-2 shadow-lg shrink-0"
                    >
                        {isExpanded ? '🙈 Ocultar' : '👀 Mostrar'}
                    </button>
                </div>

                {isExpanded && (
                    <div className="flex gap-4 overflow-x-auto py-4 scrollbar-hide animate-fade-in-up">
                        {me.hand.map((cardName, index) => {
                            const details = getCardDetails(cardName);
                            return (
                                // FIX Aplastamiento: shrink-0 evita que flexbox comprima la tarjeta
                                <div key={index} className="shrink-0">
                                    <Card
                                        name={cardName}
                                        category={details.category}
                                        imagePath={`/assets/${details.img}`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
// src/components/PlayerHand.tsx
import { useState } from 'react';
import { useGameStore } from '../store/gameEngine';
import Card from './Card';
import gameData from '../data/game-data.json';

export default function PlayerHand() {
    const players = useGameStore((state) => state.players);
    const turnIndex = useGameStore((state) => state.turnIndex);

    // Estado local para ocultar/mostrar las cartas (inicia oculto por seguridad)
    const [isExpanded, setIsExpanded] = useState(false);

    const currentPlayer = players[turnIndex];

    const getCardDetails = (cardName: string) => {
        let match = gameData.characters.find(c => c.name === cardName);
        if (match) return { category: 'character' as const, img: match.img };

        match = gameData.weapons.find(w => w.name === cardName);
        if (match) return { category: 'weapon' as const, img: match.img };

        match = gameData.locations.find(l => l.name === cardName);
        if (match) return { category: 'location' as const, img: match.img };

        return { category: 'character' as const, img: '' };
    };

    if (currentPlayer?.type !== 'human') return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E24] border-t-4 border-[#2C2D33] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.5)] z-50">
            <div className="max-w-5xl mx-auto p-4">

                {/* Cabecera del panel */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <img src={`/assets/${currentPlayer.avatar}`} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-blue-500 bg-gray-800" />
                        <div>
                            <p className="text-sm text-gray-400">Turno actual</p>
                            <p className="text-lg font-bold text-white">{currentPlayer.name}</p>
                        </div>
                    </div>

                    {/* Botón interactivo que cambia el estado */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded-xl text-xs font-bold uppercase text-white tracking-widest flex items-center gap-2 shadow-lg"
                    >
                        {isExpanded ? '🙈 Ocultar Cartas' : '👀 Mostrar Cartas'}
                    </button>
                </div>

                {/* Contenedor condicional: Solo se renderiza si isExpanded es true */}
                {isExpanded && (
                    <div className="flex gap-4 overflow-x-auto py-4 scrollbar-hide animate-fade-in-up">
                        {currentPlayer.hand.map((cardName, index) => {
                            const details = getCardDetails(cardName);
                            return (
                                <Card
                                    key={index}
                                    name={cardName}
                                    category={details.category}
                                    imagePath={`/assets/${details.img}`}
                                />
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}
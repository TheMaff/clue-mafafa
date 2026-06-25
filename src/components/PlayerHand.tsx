// src/components/PlayerHand.tsx
import { useGameStore } from '../store/gameEngine';
import Card from './Card';
import gameData from '../data/game-data.json';

export default function PlayerHand() {
    const players = useGameStore((state) => state.players);
    const turnIndex = useGameStore((state) => state.turnIndex);

    // Obtenemos el jugador actual
    const currentPlayer = players[turnIndex];

    // Función para buscar la info completa de la carta en el JSON
    const getCardDetails = (cardName: string) => {
        let match = gameData.characters.find(c => c.name === cardName);
        if (match) return { category: 'character' as const, img: match.img };

        match = gameData.weapons.find(w => w.name === cardName);
        if (match) return { category: 'weapon' as const, img: match.img };

        match = gameData.locations.find(l => l.name === cardName);
        if (match) return { category: 'location' as const, img: match.img };

        return { category: 'character' as const, img: '' }; // Fallback
    };

    // Solo mostramos la mano si es el turno de un humano
    if (currentPlayer?.type !== 'human') return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E24] border-t-4 border-[#2C2D33] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.3)] z-50 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <img src={`/assets/${currentPlayer.avatar}`} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-blue-500 bg-gray-800" />
                        <div>
                            <p className="text-sm text-gray-400">Turno actual</p>
                            <p className="text-lg font-bold text-white">{currentPlayer.name}</p>
                        </div>
                    </div>
                    <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase text-white tracking-widest">
                        Tus Cartas
                    </span>
                </div>

                {/* Contenedor horizontal scrolleable para las cartas */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
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
            </div>
        </div>
    );
}
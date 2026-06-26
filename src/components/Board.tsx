// src/components/Board.tsx
import { useState } from 'react';
import gameData from '../data/game-data.json';
import { useGameStore } from '../store/gameEngine';
import HypothesisModal from './HypothesisModal'; // <-- Importamos el modal

export default function Board() {
    const players = useGameStore((state) => state.players);
    const turnIndex = useGameStore((state) => state.turnIndex);
    const currentPlayer = players[turnIndex];

    // Estado local para saber en qué habitación estamos y si el modal debe abrirse
    const [activeRoom, setActiveRoom] = useState<string | null>(null);

    const boardCells = [
        ...gameData.locations.slice(0, 4).map(loc => ({ ...loc, isCenter: false })),
        { name: 'centro', img: '', isCenter: true },
        ...gameData.locations.slice(4, 8).map(loc => ({ ...loc, isCenter: false }))
    ];

    const handleEnterRoom = (roomName: string) => {
        if (currentPlayer?.type !== 'human') return;

        // En lugar del alert, guardamos la habitación, lo que abrirá el modal
        setActiveRoom(roomName);
    };

    const submitHypothesis = (suspect: string, weapon: string) => {
        // Por ahora pondremos un alert solo para verificar que captura bien los datos. 
        // En el siguiente ticket, esto se conectará al motor para revisar las cartas de los rivales.
        alert(`Sospechas de ${suspect} con ${weapon} en ${activeRoom}`);

        // Cerramos el modal
        setActiveRoom(null);
    };

    return (
        <>
            <div className="max-w-2xl mx-auto my-4 p-4 bg-[#1E1E24] rounded-2xl border border-gray-700 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-3 grid-rows-3 gap-3 md:gap-4 aspect-square">
                    {boardCells.map((cell) => {
                        if (cell.isCenter) {
                            return (
                                <div key="center" className="flex items-center justify-center bg-[#2C2D33] rounded-xl border-2 border-dashed border-gray-600/50 shadow-inner">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-center opacity-40 text-sm md:text-base">
                                        Pasillo<br />Central
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <button
                                key={cell.name}
                                onClick={() => handleEnterRoom(cell.name!)}
                                className="relative group overflow-hidden rounded-xl border-2 border-gray-700 hover:border-green-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                    style={{ backgroundImage: `url(/assets/${cell.img})` }}
                                />
                                <div className="absolute inset-0 bg-black/70 group-hover:bg-black/40 transition-colors duration-300" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                    <span className="text-white font-extrabold text-sm md:text-lg text-center uppercase tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                                        {cell.name}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Renderizado condicional del modal */}
            {activeRoom && (
                <HypothesisModal
                    roomName={activeRoom}
                    onClose={() => setActiveRoom(null)}
                    onSubmit={submitHypothesis}
                />
            )}
        </>
    );
}
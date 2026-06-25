// src/components/Board.tsx
import gameData from '../data/game-data.json';
import { useGameStore } from '../store/gameEngine';

export default function Board() {
    const players = useGameStore((state) => state.players);
    const turnIndex = useGameStore((state) => state.turnIndex);
    const currentPlayer = players[turnIndex];

    // Insertamos un objeto vacío en el índice 4 (el centro) para lograr el grid 3x3 perfecto
    const boardCells = [
        ...gameData.locations.slice(0, 4),
        { name: 'centro', img: null, isCenter: true },
        ...gameData.locations.slice(4, 8)
    ];

    const handleEnterRoom = (roomName: string) => {
        // Validamos que sea el turno de un humano antes de hacer nada
        if (currentPlayer?.type !== 'human') return;

        // Por ahora pondremos un alert. En el próximo ticket, esto abrirá el Modal de Acusación.
        alert(`Te moviste a ${roomName}. ¡Atento a tu entorno, pronto podrás sospechar aquí!`);
    };

    return (
        <div className="max-w-2xl mx-auto my-4 p-4 bg-[#1E1E24] rounded-2xl border border-gray-700 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-3 grid-rows-3 gap-3 md:gap-4 aspect-square">
                {boardCells.map((cell) => {
                    // Renderizamos la celda central (vacía)
                    if (cell.isCenter) {
                        return (
                            <div key="center" className="flex items-center justify-center bg-[#2C2D33] rounded-xl border-2 border-dashed border-gray-600/50 shadow-inner">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-center opacity-40 text-sm md:text-base">
                                    Pasillo<br />Central
                                </span>
                            </div>
                        );
                    }

                    // Renderizamos las locaciones interactivas
                    return (
                        <button
                            key={cell.name}
                            onClick={() => handleEnterRoom(cell.name!)}
                            className="relative group overflow-hidden rounded-xl border-2 border-gray-700 hover:border-green-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg"
                        >
                            {/* Imagen de fondo con efecto de zoom en hover */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url(/assets/${cell.img})` }}
                            />
                            {/* Overlay oscuro para legibilidad (se aclara en hover) */}
                            <div className="absolute inset-0 bg-black/70 group-hover:bg-black/40 transition-colors duration-300" />

                            {/* Contenedor del nombre de la locación */}
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
    );
}
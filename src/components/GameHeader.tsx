// src/components/GameHeader.tsx
import { useGameStore } from '../store/gameEngine';

export default function GameHeader() {
    const players = useGameStore((state) => state.players);
    const turnIndex = useGameStore((state) => state.turnIndex);
    const myPlayerId = useGameStore((state) => state.myPlayerId);
    const hypothesisResult = useGameStore((state) => state.hypothesisResult);

    const currentPlayer = players[turnIndex];
    const isMyTurn = myPlayerId ? currentPlayer?.id === myPlayerId : currentPlayer?.type === 'human';

    // Generamos un estado dinámico de texto para la mesa
    const getStatusMessage = () => {
        if (hypothesisResult) {
            if (hypothesisResult === 'no-match') {
                return `⚠️ ¡Sospecha letal! Nadie pudo refutar la hipótesis de ${currentPlayer?.name}.`;
            }
            return `🔍 ${hypothesisResult.refuterName} le está mostrando una pista a ${currentPlayer?.name}.`;
        }
        if (isMyTurn) {
            return "🟢 Es tu turno. Selecciona un sector en el mapa de Coquimbo para interrogar.";
        }
        return `⏳ Esperando jugada. ${currentPlayer?.name} está planeando su próximo movimiento...`;
    };

    return (
        <div className="w-full bg-[#1E1E24] border-b-2 border-gray-700 p-4 mb-4 rounded-2xl shadow-md">
            {/* Listado de Avatares en Fila */}
            <div className="flex justify-center gap-4 flex-wrap mb-3">
                {players.map((p, idx) => {
                    const hasTurn = idx === turnIndex;
                    const isMe = p.id === myPlayerId;

                    return (
                        <div
                            key={p.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${hasTurn
                                    ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] scale-105'
                                    : 'bg-[#2C2D33] border-gray-700 opacity-70'
                                }`}
                        >
                            <img
                                src={`/assets/${p.avatar}`}
                                alt={p.name}
                                className={`w-8 h-8 rounded-full border object-cover ${hasTurn ? 'border-blue-400' : 'border-gray-500'}`}
                            />
                            <div className="text-left">
                                <p className="text-xs font-bold text-white leading-none">
                                    {p.name} {isMe && '(Tú)'}
                                </p>
                                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                                    {p.isEliminated ? '💀 Eliminado' : hasTurn ? '⚡ Su Turno' : 'Espera'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cartel de Acción Dinámica */}
            <div className="bg-[#2C2D33] border border-gray-700/50 rounded-xl py-2 px-4 text-center">
                <p className="text-sm font-semibold tracking-wide text-gray-200 animate-pulse">
                    {getStatusMessage()}
                </p>
            </div>
        </div>
    );
}
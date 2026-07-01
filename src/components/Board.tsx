// src/components/Board.tsx
import { useState } from 'react';
import gameData from '../data/game-data.json';
import { useGameStore } from '../store/gameEngine';
import HypothesisModal from './HypothesisModal';
import AccusationModal from './AccusationModal';
import Card from './Card';

export default function Board() {
    const players = useGameStore((state) => state.players);
    const turnIndex = useGameStore((state) => state.turnIndex);
    const currentPlayer = players[turnIndex];

    const myPlayerId = useGameStore((state) => state.myPlayerId);
    const isMyTurn = myPlayerId ? currentPlayer?.id === myPlayerId : currentPlayer?.type === 'human';

    // Lógica de Sospecha
    const checkHypothesis = useGameStore((state) => state.checkHypothesis);
    const hypothesisResult = useGameStore((state) => state.hypothesisResult);
    const clearHypothesisResult = useGameStore((state) => state.clearHypothesisResult);
    const nextTurn = useGameStore((state) => state.nextTurn);

    // Lógica de Acusación Final
    const makeAccusation = useGameStore((state) => state.makeAccusation);
    const winner = useGameStore((state) => state.winner);
    const envelope = useGameStore((state) => state.envelope);

    // Estados locales para los Modales
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [showAccusationModal, setShowAccusationModal] = useState(false);
    const [showLoserScreen, setShowLoserScreen] = useState(false);

    // Armamos la cuadrícula de 3x3
    const boardCells = [
        ...gameData.locations.slice(0, 4).map(loc => ({ ...loc, isCenter: false })),
        { name: 'centro', img: '', isCenter: true },
        ...gameData.locations.slice(4, 8).map(loc => ({ ...loc, isCenter: false }))
    ];

    const handleEnterRoom = (roomName: string) => {
        if (currentPlayer?.type !== 'human') return;
        setActiveRoom(roomName);
    };

    const submitHypothesis = (suspect: string, weapon: string) => {
        setActiveRoom(null);
        checkHypothesis(suspect, weapon, activeRoom!);
    };

    const handleEndTurn = () => {
        clearHypothesisResult();
        nextTurn();
    };

    const handleFinalAccusation = (suspect: string, weapon: string, location: string) => {
        setShowAccusationModal(false);
        clearHypothesisResult(); // Por si venimos desde el modal de respuesta de interrogatorio

        const isCorrect = makeAccusation(suspect, weapon, location);
        if (!isCorrect) {
            setShowLoserScreen(true);
        }
    };

    const handleLoserAcknowledge = () => {
        setShowLoserScreen(false);
        nextTurn(); // Pasa el turno al siguiente jugador porque estás eliminado
    };

    // Utilidad para renderizar la tarjeta en el modal de respuesta
    const getCardDetails = (cardName: string) => {
        let match = gameData.characters.find(c => c.name === cardName);
        if (match) return { category: 'character' as const, img: match.img };
        match = gameData.weapons.find(w => w.name === cardName);
        if (match) return { category: 'weapon' as const, img: match.img };
        match = gameData.locations.find(l => l.name === cardName);
        if (match) return { category: 'location' as const, img: match.img };
        return { category: 'character' as const, img: '' };
    };

    // PANTALLA DE VICTORIA GLOBAL
    if (winner && envelope) {
        return (
            <div className="flex flex-col items-center justify-center h-full mt-10 p-6 bg-green-900/40 rounded-3xl border border-green-500 shadow-[0_0_100px_rgba(34,197,94,0.3)] text-center animate-fade-in-up">
                <span className="text-6xl mb-4">🏆</span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">¡Misterio Resuelto!</h1>
                <p className="text-xl md:text-2xl text-green-300 mb-8 font-bold">{winner.name} ha ganado la partida.</p>

                <div className="bg-[#1E1E24] p-6 rounded-2xl border border-gray-700 flex flex-col items-center gap-4 w-full max-w-2xl">
                    <p className="text-gray-400 uppercase tracking-widest text-sm font-bold mb-2">El crimen fue cometido por:</p>
                    <div className="flex flex-col md:flex-row gap-4 mb-4 w-full justify-center">
                        <div className="text-center font-bold text-red-400 bg-red-950/50 p-4 rounded-xl flex-1 border border-red-900">{envelope.character}</div>
                        <div className="text-center font-bold text-blue-400 bg-blue-950/50 p-4 rounded-xl flex-1 border border-blue-900">con {envelope.weapon}</div>
                        <div className="text-center font-bold text-green-400 bg-green-950/50 p-4 rounded-xl flex-1 border border-green-900">en {envelope.location}</div>
                    </div>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-colors w-full md:w-auto">
                        Jugar de Nuevo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* MAPA PRINCIPAL */}
            <div className="max-w-2xl mx-auto my-4 p-4 bg-[#1E1E24] rounded-2xl border border-gray-700 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-3 grid-rows-3 gap-3 md:gap-4 aspect-square">
                    {boardCells.map((cell) => {

                        // EL PASILLO CENTRAL (BOTÓN PARA ACUSAR)
                        if (cell.isCenter) {
                            return (
                                <button
                                    key="center"
                                    onClick={() => setShowAccusationModal(true)}
                                    // disabled={currentPlayer?.type !== 'human' || currentPlayer?.isEliminated}
                                    disabled={!isMyTurn || currentPlayer?.isEliminated}
                                    className="flex items-center justify-center bg-[#2C2D33] rounded-xl border-2 border-dashed border-red-900/50 hover:border-red-500 transition-colors shadow-inner group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="text-gray-500 group-hover:text-red-400 font-bold uppercase tracking-widest text-center text-sm md:text-base transition-colors">
                                        Pasillo<br />Central<br />
                                        <span className="text-[10px] text-red-500/0 group-hover:text-red-400 block mt-2">Acusar</span>
                                    </span>
                                </button>
                            );
                        }

                        // BOTONES DE HABITACIONES
                        return (
                            <button
                                key={cell.name}
                                onClick={() => handleEnterRoom(cell.name!)}
                                // disabled={currentPlayer?.type !== 'human' || currentPlayer?.isEliminated}
                                disabled={!isMyTurn || currentPlayer?.isEliminated}
                                className="relative group overflow-hidden rounded-xl border-2 border-gray-700 hover:border-green-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* MODAL 1: HACER SOSPECHA (INTERROGATORIO) */}
            {activeRoom && (
                <HypothesisModal
                    roomName={activeRoom}
                    onClose={() => setActiveRoom(null)}
                    onSubmit={submitHypothesis}
                />
            )}

            {/* MODAL 2: RESULTADO DEL INTERROGATORIO */}
            {hypothesisResult && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-fade-in-up">
                    <div className="bg-[#1E1E24] border-2 border-blue-500 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] p-8 max-w-md w-full text-center flex flex-col items-center">

                        {hypothesisResult === 'no-match' ? (
                            <>
                                <div className="w-20 h-20 bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-4xl">😱</span>
                                </div>
                                <h2 className="text-2xl font-bold text-red-400 mb-2">¡Nadie tiene esas cartas!</h2>
                                <p className="text-gray-300 mb-6">Eso significa que acabas de encontrar la combinación ganadora, o alguien está mintiendo.</p>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-green-900/50 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-4xl">🕵️‍♂️</span>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">
                                    <span className="text-blue-400">{hypothesisResult.refuterName}</span> te ha mostrado una carta:
                                </h2>
                                <div className="my-6 transform scale-110">
                                    <Card
                                        name={hypothesisResult.cardShown}
                                        category={getCardDetails(hypothesisResult.cardShown).category}
                                        imagePath={`/assets/${getCardDetails(hypothesisResult.cardShown).img}`}
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex flex-col gap-3 w-full mt-4">
                            <button
                                onClick={handleEndTurn}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                Terminar Turno
                            </button>
                            <button
                                onClick={() => setShowAccusationModal(true)}
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/50 transition-all"
                            >
                                ¡Hacer Acusación Final!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: ACUSACIÓN FINAL */}
            {showAccusationModal && (
                <AccusationModal
                    onClose={() => setShowAccusationModal(false)}
                    onSubmit={handleFinalAccusation}
                />
            )}

            {/* MODAL 4: DERROTA / ELIMINACIÓN */}
            {showLoserScreen && (
                <div className="fixed inset-0 bg-red-950/95 z-[80] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#1E1E24] border-4 border-red-600 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_100px_rgba(220,38,38,0.5)]">
                        <span className="text-7xl block mb-4">💀</span>
                        <h2 className="text-3xl font-extrabold text-red-500 mb-2">¡ACUSACIÓN ERRÓNEA!</h2>
                        <p className="text-gray-300 mb-6 font-semibold">
                            Esa no era la combinación correcta. Has quedado <span className="text-white bg-red-600 px-2 rounded">ELIMINADO</span> de la partida. Tus cartas seguirán en juego para desmentir a los demás.
                        </p>
                        <button
                            onClick={handleLoserAcknowledge}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-colors text-lg"
                        >
                            Aceptar mi destino
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
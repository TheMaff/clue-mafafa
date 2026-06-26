// src/components/Board.tsx
import { useState } from 'react';
import gameData from '../data/game-data.json';
import { useGameStore } from '../store/gameEngine';
import HypothesisModal from './HypothesisModal';
import Card from './Card'; // Importamos el componente Card para mostrar el resultado visualmente

export default function Board() {
  const players = useGameStore((state) => state.players);
  const turnIndex = useGameStore((state) => state.turnIndex);
  const currentPlayer = players[turnIndex];
  
  // Nuevas variables del motor
  const checkHypothesis = useGameStore((state) => state.checkHypothesis);
  const hypothesisResult = useGameStore((state) => state.hypothesisResult);
  const clearHypothesisResult = useGameStore((state) => state.clearHypothesisResult);
  const nextTurn = useGameStore((state) => state.nextTurn);

  const [activeRoom, setActiveRoom] = useState<string | null>(null);

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
    // 1. Cerramos el modal de pregunta
    setActiveRoom(null);
    // 2. Disparamos la lógica del motor
    checkHypothesis(suspect, weapon, activeRoom!);
  };

  const handleEndTurn = () => {
    clearHypothesisResult();
    nextTurn();
  };

  // Función auxiliar para obtener la imagen de la carta revelada
  const getCardDetails = (cardName: string) => {
    let match = gameData.characters.find(c => c.name === cardName);
    if (match) return { category: 'character' as const, img: match.img };
    match = gameData.weapons.find(w => w.name === cardName);
    if (match) return { category: 'weapon' as const, img: match.img };
    match = gameData.locations.find(l => l.name === cardName);
    if (match) return { category: 'location' as const, img: match.img };
    return { category: 'character' as const, img: '' };
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

      {activeRoom && (
        <HypothesisModal 
          roomName={activeRoom} 
          onClose={() => setActiveRoom(null)} 
          onSubmit={submitHypothesis} 
        />
      )}

      {/* NUEVO: Modal de Resultado del Interrogatorio */}
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
                  {/* Reutilizamos tu hermoso componente Card */}
                  <Card 
                    name={hypothesisResult.cardShown} 
                    category={getCardDetails(hypothesisResult.cardShown).category} 
                    imagePath={`/assets/${getCardDetails(hypothesisResult.cardShown).img}`} 
                  />
                </div>
              </>
            )}

            <div className="flex gap-4 w-full mt-4">
              <button 
                onClick={handleEndTurn}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Terminar Turno
              </button>
              {/* Dejaremos el botón de acusar listo para la próxima tarea */}
              <button className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/50 transition-all hover:scale-105">
                ¡Hacer Acusación Final!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
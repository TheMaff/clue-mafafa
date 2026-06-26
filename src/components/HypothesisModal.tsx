// src/components/HypothesisModal.tsx
import { useState } from 'react';
import gameData from '../data/game-data.json';

interface HypothesisModalProps {
    roomName: string;
    onClose: () => void;
    onSubmit: (suspect: string, weapon: string) => void;
}

export default function HypothesisModal({ roomName, onClose, onSubmit }: HypothesisModalProps) {
    const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
    const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);

    const handleSubmit = () => {
        if (selectedSuspect && selectedWeapon) {
            onSubmit(selectedSuspect, selectedWeapon);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1E1E24] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Cabecera del Modal */}
                <div className="bg-blue-900/50 border-b border-blue-800 p-4 text-center">
                    <h2 className="text-2xl font-extrabold text-blue-400">Hacer Sospecha</h2>
                    <p className="text-gray-300 text-sm mt-1">
                        Estás en <span className="font-bold text-white uppercase tracking-wider">{roomName}</span>
                    </p>
                </div>

                {/* Cuerpo scrolleable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {/* Sección: Sospechoso */}
                    <div className="mb-6">
                        <h3 className="text-gray-400 font-bold mb-3 uppercase tracking-widest text-sm">1. Elige Sospechoso</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {gameData.characters.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setSelectedSuspect(c.name)}
                                    className={`p-2 rounded-lg border-2 text-sm font-semibold transition-all ${selectedSuspect === c.name
                                            ? 'border-red-500 bg-red-500/20 text-white'
                                            : 'border-gray-700 bg-[#2C2D33] text-gray-400 hover:border-gray-500 hover:text-gray-200'
                                        }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sección: Arma */}
                    <div>
                        <h3 className="text-gray-400 font-bold mb-3 uppercase tracking-widest text-sm">2. Elige Arma</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {gameData.weapons.map(w => (
                                <button
                                    key={w.name}
                                    onClick={() => setSelectedWeapon(w.name)}
                                    className={`p-2 rounded-lg border-2 text-sm font-semibold transition-all ${selectedWeapon === w.name
                                            ? 'border-blue-500 bg-blue-500/20 text-white'
                                            : 'border-gray-700 bg-[#2C2D33] text-gray-400 hover:border-gray-500 hover:text-gray-200'
                                        }`}
                                >
                                    {w.name}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer con Botones */}
                <div className="p-4 border-t border-gray-700 bg-[#2C2D33] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl font-bold text-gray-400 hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedSuspect || !selectedWeapon}
                        className={`px-6 py-2 rounded-xl font-bold transition-colors ${selectedSuspect && selectedWeapon
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        ¡Acusar!
                    </button>
                </div>

            </div>
        </div>
    );
}
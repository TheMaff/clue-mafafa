// src/components/AccusationModal.tsx
import { useState } from 'react';
import gameData from '../data/game-data.json';

interface AccusationModalProps {
    onClose: () => void;
    onSubmit: (suspect: string, weapon: string, location: string) => void;
}

export default function AccusationModal({ onClose, onSubmit }: AccusationModalProps) {
    const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
    const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-red-950/90 z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1E1E24] border-2 border-red-600 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                <div className="bg-red-900/50 border-b border-red-800 p-4 text-center">
                    <h2 className="text-3xl font-extrabold text-red-500 flex justify-center items-center gap-2">
                        🚨 ACUSACIÓN FINAL 🚨
                    </h2>
                    <p className="text-gray-300 text-sm mt-1">
                        Si te equivocas, quedarás eliminado de la partida. ¡No hay vuelta atrás!
                    </p>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div>
                        <h3 className="text-red-400 font-bold mb-3 uppercase tracking-widest text-xs text-center">Sospechoso</h3>
                        <div className="flex flex-col gap-2">
                            {gameData.characters.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setSelectedSuspect(c.name)}
                                    className={`p-2 rounded border text-xs font-semibold transition-all ${selectedSuspect === c.name ? 'border-red-500 bg-red-500/20 text-white' : 'border-gray-700 text-gray-400'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-blue-400 font-bold mb-3 uppercase tracking-widest text-xs text-center">Arma</h3>
                        <div className="flex flex-col gap-2">
                            {gameData.weapons.map(w => (
                                <button
                                    key={w.name}
                                    onClick={() => setSelectedWeapon(w.name)}
                                    className={`p-2 rounded border text-xs font-semibold transition-all ${selectedWeapon === w.name ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-gray-700 text-gray-400'}`}
                                >
                                    {w.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-green-400 font-bold mb-3 uppercase tracking-widest text-xs text-center">Locación</h3>
                        <div className="flex flex-col gap-2">
                            {gameData.locations.map(l => (
                                <button
                                    key={l.name}
                                    onClick={() => setSelectedLocation(l.name)}
                                    className={`p-2 rounded border text-xs font-semibold transition-all ${selectedLocation === l.name ? 'border-green-500 bg-green-500/20 text-white' : 'border-gray-700 text-gray-400'}`}
                                >
                                    {l.name}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-gray-700 bg-[#2C2D33] flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl font-bold text-gray-400 hover:bg-gray-700">
                        Me arrepentí
                    </button>
                    <button
                        onClick={() => onSubmit(selectedSuspect!, selectedWeapon!, selectedLocation!)}
                        disabled={!selectedSuspect || !selectedWeapon || !selectedLocation}
                        className="px-6 py-2 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Sellar mi destino
                    </button>
                </div>
            </div>
        </div>
    );
}
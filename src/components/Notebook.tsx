// src/components/Notebook.tsx
import { useState } from 'react';
import { useGameStore } from '../store/gameEngine';
import gameData from '../data/game-data.json';

export default function Notebook() {
    const [isOpen, setIsOpen] = useState(false);
    const notes = useGameStore((state) => state.notes);
    const toggleNote = useGameStore((state) => state.toggleNote);

    // Función auxiliar para renderizar cada bloque de la libreta
    const renderCategory = (title: string, items: { name: string }[]) => (
        <div className="mb-6">
            <h3 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-widest border-b border-gray-700 pb-1">
                {title}
            </h3>
            <div className="flex flex-col gap-3">
                {items.map((item) => {
                    const isChecked = notes[item.name];
                    return (
                        <label key={item.name} className="flex items-center gap-3 cursor-pointer group">
                            <div
                                onClick={() => toggleNote(item.name)} // ¡Aquí está la magia que faltaba!
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors 
                ${isChecked ? 'bg-green-500 border-green-500' : 'bg-[#2C2D33] border-gray-500 group-hover:border-blue-400'}`}>
                                {isChecked && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className={`text-sm transition-colors ${isChecked ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
                                {item.name}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            {/* Botón flotante para abrir la libreta (esquina superior derecha) */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-6 right-6 bg-amber-600 hover:bg-amber-500 text-white p-3 rounded-full shadow-lg z-40 transition-transform hover:scale-110 flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden md:inline font-bold">Libreta</span>
            </button>

            {/* Overlay oscuro cuando la libreta está abierta */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Panel lateral deslizante */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-[#1E1E24] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-700 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#2C2D33]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📝 Mis Notas
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido de la libreta scrolleable */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {renderCategory('Sospechosos', gameData.characters)}
                    {renderCategory('Armas', gameData.weapons)}
                    {renderCategory('Locaciones', gameData.locations)}
                </div>
            </div>
        </>
    );
}
// src/components/CoverScreen.tsx
import { useState } from 'react';
import { useGameStore } from '../store/gameEngine';
import gameData from '../data/game-data.json';

export default function CoverScreen() {
    const startGame = useGameStore((state) => state.startGame);

    // Estados para manejar el flujo de la pantalla
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Estados del formulario
    const [playerName, setPlayerName] = useState('Detective');
    const [selectedAvatar, setSelectedAvatar] = useState(gameData.characters[0].img);
    const [cpuCount, setCpuCount] = useState(2);

    const handleStartGame = () => {
        // 1. Creamos al jugador humano
        const humanPlayers = [
            { name: playerName || 'Detective', avatar: selectedAvatar },
        ];

        // 2. Filtramos los avatares disponibles para que la CPU no repita el tuyo
        const availableCpuAvatars = gameData.characters
            .map(c => c.img)
            .filter(img => img !== selectedAvatar);

        // 3. Creamos la cantidad de CPUs solicitada
        const cpuPlayers = [];
        for (let i = 0; i < cpuCount; i++) {
            // Asignamos avatar secuencial de los disponibles
            const cpuAvatar = availableCpuAvatars[i % availableCpuAvatars.length];
            // Buscamos el nombre correspondiente a ese avatar
            const cpuName = gameData.characters.find(c => c.img === cpuAvatar)?.name || `CPU ${i + 1}`;

            cpuPlayers.push({ name: cpuName, avatar: cpuAvatar });
        }

        // Disparamos el motor
        startGame(humanPlayers, cpuPlayers);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#2C2D33] p-4 text-white">
            <div className="bg-[#1E1E24] p-6 md:p-10 rounded-2xl shadow-2xl border border-gray-700 max-w-xl w-full">

                {!isConfiguring ? (
                    // VISTA 1: PORTADA CLÁSICA
                    <div className="text-center animate-fade-in">
                        <h1 className="text-5xl md:text-6xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            CLUE
                        </h1>
                        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-300 tracking-widest">COQUIMBO</h2>

                        <p className="text-gray-400 mb-10 text-sm md:text-base">
                            Descubre quién se pitió a la tía Mafafa, con qué arma y en qué locación.
                        </p>

                        <button
                            onClick={() => setIsConfiguring(true)}
                            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Jugar Modo Solitario
                        </button>
                    </div>
                ) : (
                    // VISTA 2: CONFIGURACIÓN DE PARTIDA
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                            <button onClick={() => setIsConfiguring(false)} className="text-gray-400 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest">Configurar Partida</h2>
                        </div>

                        {/* Input Nombre */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Tu Nombre</label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                className="w-full bg-[#2C2D33] border-2 border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Ej. Inspector"
                                maxLength={15}
                            />
                        </div>

                        {/* Selección de Avatar */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Elige tu Personaje</label>
                            <div className="grid grid-cols-4 gap-2">
                                {gameData.characters.map((char) => (
                                    <button
                                        key={char.name}
                                        onClick={() => setSelectedAvatar(char.img)}
                                        className={`relative rounded-xl border-2 overflow-hidden transition-all aspect-square ${selectedAvatar === char.img
                                                ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105'
                                                : 'border-gray-700 opacity-60 hover:opacity-100 hover:border-gray-500'
                                            }`}
                                    >
                                        <img src={`/assets/${char.img}`} alt={char.name} className="w-full h-full object-cover bg-gray-800" />
                                        {selectedAvatar === char.img && (
                                            <div className="absolute inset-x-0 bottom-0 bg-blue-600/90 py-1">
                                                <p className="text-[10px] text-center font-bold">{char.name}</p>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cantidad de Rivales */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Rivales (CPU)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setCpuCount(num)}
                                        className={`flex-1 py-2 rounded-lg border-2 font-bold transition-all ${cpuCount === num
                                                ? 'border-red-500 bg-red-500/20 text-red-400'
                                                : 'border-gray-700 bg-[#2C2D33] text-gray-500 hover:border-gray-500 hover:text-gray-300'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Botón Iniciar */}
                        <button
                            onClick={handleStartGame}
                            className="w-full py-4 px-6 bg-green-600 hover:bg-green-500 transition-colors rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                        >
                            Comenzar Investigación
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
// src/components/CoverScreen.tsx
import { useState } from 'react';
import { useGameStore } from '../store/gameEngine';
import gameData from '../data/game-data.json';

export default function CoverScreen() {
    const startGame = useGameStore((state) => state.startGame);

    const [view, setView] = useState<'home' | 'solo' | 'multiplayer'>('home');
    const [multiplayerAction, setMultiplayerAction] = useState<'create' | 'join' | null>(null);

    const [playerName, setPlayerName] = useState('Detective');
    const [selectedAvatar, setSelectedAvatar] = useState(gameData.characters[0].img);
    const [cpuCount, setCpuCount] = useState(2);
    const [roomCode, setRoomCode] = useState('');

    const handleStartSolo = () => {
        const humanPlayers = [{ name: playerName || 'Detective', avatar: selectedAvatar }];
        const availableCpuAvatars = gameData.characters.map(c => c.img).filter(img => img !== selectedAvatar);
        const cpuPlayers = [];

        for (let i = 0; i < cpuCount; i++) {
            const cpuAvatar = availableCpuAvatars[i % availableCpuAvatars.length];
            const cpuName = gameData.characters.find(c => c.img === cpuAvatar)?.name || `CPU ${i + 1}`;
            cpuPlayers.push({ name: cpuName, avatar: cpuAvatar });
        }

        startGame(humanPlayers, cpuPlayers);
    };

    const handleCreateRoom = () => {
        // Generamos un código alfanumérico de 5 caracteres
        const newCode = Math.random().toString(36).substring(2, 7).toUpperCase();

        // Por ahora solo mostraremos una alerta. En el próximo ticket, esto escribirá en Firebase.
        alert(`Sala creada con el código: ${newCode}\nEsperando a que tus amigos se unan...`);
    };

    const handleJoinRoom = () => {
        if (roomCode.length !== 5) {
            alert("El código debe tener 5 caracteres.");
            return;
        }
        alert(`Intentando unirse a la sala: ${roomCode.toUpperCase()}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#2C2D33] p-4 text-white">
            <div className="bg-[#1E1E24] p-6 md:p-10 rounded-2xl shadow-2xl border border-gray-700 max-w-xl w-full">

                {view === 'home' && (
                    <div className="text-center animate-fade-in">
                        <h1 className="text-5xl md:text-6xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            CLUE
                        </h1>
                        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-300 tracking-widest">COQUIMBO</h2>

                        <div className="flex flex-col gap-4 mt-8">
                            <button onClick={() => setView('solo')} className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl font-bold text-lg">
                                Jugar Solo (CPU)
                            </button>
                            <button onClick={() => setView('multiplayer')} className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-500 transition-colors rounded-xl font-bold text-lg">
                                Jugar con Amigos (Online)
                            </button>
                        </div>
                    </div>
                )}

                {/* ... (VISTA SOLO SE MANTIENE IGUAL A LO QUE YA TENÍAMOS) ... */}
                {view === 'solo' && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                            <button onClick={() => setView('home')} className="text-gray-400 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest">Modo Solitario</h2>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Tu Nombre</label>
                            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full bg-[#2C2D33] border-2 border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" maxLength={15} />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Elige tu Personaje</label>
                            <div className="grid grid-cols-4 gap-2">
                                {gameData.characters.map((char) => (
                                    <button key={char.name} onClick={() => setSelectedAvatar(char.img)} className={`relative rounded-xl border-2 overflow-hidden transition-all aspect-square ${selectedAvatar === char.img ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105' : 'border-gray-700 opacity-60 hover:opacity-100 hover:border-gray-500'}`}>
                                        <img src={`/assets/${char.img}`} alt={char.name} className="w-full h-full object-cover bg-gray-800" />
                                        {selectedAvatar === char.img && <div className="absolute inset-x-0 bottom-0 bg-blue-600/90 py-1"><p className="text-[10px] text-center font-bold">{char.name}</p></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Rivales (CPU)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button key={num} onClick={() => setCpuCount(num)} className={`flex-1 py-2 rounded-lg border-2 font-bold transition-all ${cpuCount === num ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-gray-700 bg-[#2C2D33] text-gray-500'}`}>{num}</button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleStartSolo} className="w-full py-4 px-6 bg-green-600 hover:bg-green-500 transition-colors rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                            Comenzar Investigación
                        </button>
                    </div>
                )}

                {/* NUEVA VISTA: MULTIJUGADOR ONLINE */}
                {view === 'multiplayer' && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                            <button onClick={() => { setView('home'); setMultiplayerAction(null); }} className="text-gray-400 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <h2 className="text-xl font-bold text-purple-400 uppercase tracking-widest">Multijugador Online</h2>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Tu Nombre</label>
                            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full bg-[#2C2D33] border-2 border-purple-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" maxLength={15} />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Elige tu Personaje</label>
                            <div className="grid grid-cols-4 gap-2">
                                {gameData.characters.map((char) => (
                                    <button key={char.name} onClick={() => setSelectedAvatar(char.img)} className={`relative rounded-xl border-2 overflow-hidden transition-all aspect-square ${selectedAvatar === char.img ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105' : 'border-gray-700 opacity-60 hover:opacity-100 hover:border-gray-500'}`}>
                                        <img src={`/assets/${char.img}`} alt={char.name} className="w-full h-full object-cover bg-gray-800" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!multiplayerAction ? (
                            <div className="flex gap-4">
                                <button onClick={() => setMultiplayerAction('create')} className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold">Crear Sala</button>
                                <button onClick={() => setMultiplayerAction('join')} className="flex-1 py-4 bg-gray-600 hover:bg-gray-500 rounded-xl font-bold">Unirse a Sala</button>
                            </div>
                        ) : multiplayerAction === 'join' ? (
                            <div className="flex flex-col gap-4 animate-fade-in">
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    placeholder="CÓDIGO (Ej. X7Y9Z)"
                                    className="w-full bg-[#2C2D33] border-2 border-purple-600 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-bold uppercase"
                                    maxLength={5}
                                />
                                <button onClick={handleJoinRoom} className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold">Entrar a la Sala</button>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <button onClick={handleCreateRoom} className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold">Generar Código y Crear Sala</button>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
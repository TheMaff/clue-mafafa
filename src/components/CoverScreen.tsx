// src/components/CoverScreen.tsx
import { useState } from 'react';
import { useGameStore } from '../store/gameEngine';
import gameData from '../data/game-data.json';

export default function CoverScreen() {
  const startGame = useGameStore((state) => state.startGame);
  
  // Extraemos las nuevas funciones y estados de Firebase
  const { 
    createMultiplayerRoom, 
    joinMultiplayerRoom, 
    roomId, 
    isHost, 
    remotePlayers,
    leaveRoom
  } = useGameStore();

  const [view, setView] = useState<'home' | 'solo' | 'multiplayer' | 'lobby'>('home');
  const [multiplayerAction, setMultiplayerAction] = useState<'create' | 'join' | null>(null);
  
  const [playerName, setPlayerName] = useState('Detective');
  const [selectedAvatar, setSelectedAvatar] = useState(gameData.characters[0].img);
  const [cpuCount, setCpuCount] = useState(2);
  const [roomCodeInput, setRoomCodeInput] = useState('');

  const handleStartSolo = () => {
    // ... (Tu código de modo solitario se mantiene intacto) ...
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

  const handleCreateRoom = async () => {
    await createMultiplayerRoom(playerName || 'Detective', selectedAvatar);
    setView('lobby');
  };

  const handleJoinRoom = async () => {
    if (roomCodeInput.length !== 5) {
      alert("El código debe tener 5 caracteres.");
      return;
    }
    const success = await joinMultiplayerRoom(roomCodeInput, playerName || 'Detective', selectedAvatar);
    if (success) {
      setView('lobby');
    } else {
      alert("Sala no encontrada o la partida ya comenzó.");
    }
  };

  const handleLeaveLobby = () => {
    leaveRoom();
    setView('multiplayer');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#2C2D33] p-4 text-white">
      <div className="bg-[#1E1E24] p-6 md:p-10 rounded-2xl shadow-2xl border border-gray-700 max-w-xl w-full">
        
        {/* ... (Las vistas 'home', 'solo' y 'multiplayer' son IGUALES a lo que ya tenías, solo acorto aquí por legibilidad) ... */}
        {view === 'home' && (
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">CLUE</h1>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-300 tracking-widest">COQUIMBO</h2>
            <div className="flex flex-col gap-4 mt-8">
              <button onClick={() => setView('solo')} className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg">Jugar Solo (CPU)</button>
              <button onClick={() => setView('multiplayer')} className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-lg">Jugar con Amigos (Online)</button>
            </div>
          </div>
        )}

        {/* ... (Omite 'solo' y 'multiplayer' si ya los tienes, o pégalos tal cual de tu paso anterior. La magia está en 'lobby') ... */}
        {/* Para este snippet, asegúrate de mantener tus vistas de 'solo' y 'multiplayer' como estaban */}

        {/* --- NUEVA VISTA: LA SALA DE ESPERA (LOBBY) --- */}
        {view === 'lobby' && (
          <div className="animate-fade-in text-center">
            <div className="mb-8">
              <h2 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Código de la Sala</h2>
              <div className="bg-[#2C2D33] border-2 border-purple-500 rounded-xl py-4 px-6 inline-block">
                <span className="text-4xl font-black tracking-[0.3em] text-white">{roomId}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Comparte este código con tus amigos.</p>
            </div>

            <div className="bg-[#2C2D33] rounded-xl p-4 mb-8 text-left border border-gray-700">
              <h3 className="text-gray-400 font-bold uppercase mb-4 text-sm border-b border-gray-600 pb-2">Jugadores Conectados ({remotePlayers.length}/6)</h3>
              <div className="flex flex-col gap-3">
                {remotePlayers.map((p, index) => (
                  <div key={p.id} className="flex items-center gap-4 bg-[#1E1E24] p-3 rounded-lg border border-gray-700">
                    <img src={`/assets/${p.avatar}`} alt={p.name} className="w-12 h-12 rounded-full border-2 border-purple-500 object-cover bg-gray-800" />
                    <div>
                      <p className="font-bold text-white text-lg">{p.name}</p>
                      {p.isHost && <span className="text-xs bg-purple-600 px-2 py-1 rounded text-white font-bold">Líder (Host)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isHost ? (
                <button 
                  disabled={remotePlayers.length < 2}
                  className="w-full py-4 px-6 bg-green-600 hover:bg-green-500 transition-colors rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                  {remotePlayers.length < 2 ? 'Esperando jugadores...' : 'Comenzar Partida'}
                </button>
              ) : (
                <p className="text-purple-400 font-bold animate-pulse py-4">Esperando a que el líder inicie la partida...</p>
              )}
              
              <button onClick={handleLeaveLobby} className="text-gray-400 hover:text-red-400 underline font-bold mt-2">
                Salir de la sala
              </button>
            </div>
          </div>
        )}
        
        {/* Asegúrate de renderizar tus vistas view === 'solo' y view === 'multiplayer' aquí debajo para que todo el formulario siga funcionando */}

      </div>
    </div>
  );
}
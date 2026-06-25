// src/App.tsx
import { useGameStore } from './store/gameEngine';
import CoverScreen from './components/CoverScreen';
import PlayerHand from './components/PlayerHand';

function App() {
  // Escuchamos directamente esta variable de nuestro motor
  const isGameActive = useGameStore((state) => state.isGameActive);
  const players = useGameStore((state) => state.players);
  const envelope = useGameStore((state) => state.envelope);

  return (
    <div className="min-h-screen bg-[#2C2D33] text-gray-100 font-sans selection:bg-purple-500 selection:text-white">
      {!isGameActive ? (
        <CoverScreen />
      ) : (
        <div className="p-8">
          <h2 className="text-3xl font-bold text-green-400 mb-4">¡El juego ha comenzado!</h2>

          {/* Un volcado temporal de datos para comprobar que el motor hizo su trabajo */}
          <div className="bg-[#1E1E24] p-6 rounded-xl border border-gray-700 mb-4">
            <h3 className="font-bold text-xl mb-2 text-red-400">Sobre Secreto (No mirar en producción 👀)</h3>
            <pre className="text-sm text-gray-300">{JSON.stringify(envelope, null, 2)}</pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {players.map((p) => (
              <div key={p.id} className="bg-[#1E1E24] p-4 rounded-xl border border-gray-700">
                <h4 className="font-bold text-blue-300">{p.name} ({p.type})</h4>
                <p className="text-xs text-gray-400 mt-2">Cartas en mano:</p>
                <PlayerHand />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
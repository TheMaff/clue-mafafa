// src/App.tsx
import { useGameStore } from './store/gameEngine';
import CoverScreen from './components/CoverScreen';
import PlayerHand from './components/PlayerHand';
import Board from './components/Board';

function App() {
  const isGameActive = useGameStore((state) => state.isGameActive);

  return (
    // Agregamos pb-32 para el espacio del panel inferior
    <div className="min-h-screen bg-[#2C2D33] text-gray-100 font-sans selection:bg-purple-500 selection:text-white pb-32">
      {!isGameActive ? (
        <CoverScreen />
      ) : (
        <div className="max-w-5xl mx-auto p-4 md:p-8">

          {/* Header del juego */}
          <header className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Misterio en Coquimbo
            </h2>
          </header>

          {/* El Tablero Interactivo */}
          <Board />

        </div>
      )}

      {/* Renderizado condicional del panel inferior */}
      {isGameActive && <PlayerHand />}
    </div>
  );
}

export default App;
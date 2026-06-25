// src/components/CoverScreen.tsx
import { useGameStore } from '../store/gameEngine';
import gameData from '../data/game-data.json';

export default function CoverScreen() {
    const startGame = useGameStore((state) => state.startGame);

    const handleQuickStart = () => {
        // Tomamos personajes directo del JSON para la prueba
        const humanPlayers = [
            { name: 'Tú', avatar: gameData.characters[0].img },
            { name: 'Amigo', avatar: gameData.characters[1].img },
        ];
        const cpuPlayers = [
            { name: 'CPU 1', avatar: gameData.characters[2].img },
        ];

        // Disparamos el motor
        startGame(humanPlayers, cpuPlayers);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#2C2D33] p-4 text-white">
            <div className="bg-[#1E1E24] p-10 rounded-2xl shadow-2xl border border-gray-700 max-w-lg w-full text-center">
                <h1 className="text-5xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    CLUE
                </h1>
                <h2 className="text-2xl font-bold mb-8 text-gray-300 tracking-widest">COQUIMBO</h2>

                <p className="text-gray-400 mb-8 text-sm">
                    Descubre quién se pitió a la tía Mafafa, con qué arma y en qué locación.
                </p>

                <button
                    onClick={handleQuickStart}
                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Partida Rápida (Test)
                </button>
            </div>
        </div>
    );
}
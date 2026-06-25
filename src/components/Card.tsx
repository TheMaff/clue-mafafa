// src/components/Card.tsx
interface CardProps {
    name: string;
    category: 'character' | 'weapon' | 'location';
    imagePath: string;
}

export default function Card({ name, category, imagePath }: CardProps) {
    // Asignamos un color de borde dependiendo de la categoría (como en Figma)
    const borderColor =
        category === 'character' ? 'border-red-400' :
            category === 'weapon' ? 'border-blue-400' : 'border-green-400';

    return (
        <div className={`flex flex-col items-center justify-between w-28 h-40 bg-white rounded-xl border-4 ${borderColor} shadow-md overflow-hidden transform transition hover:-translate-y-2 hover:shadow-xl cursor-pointer`}>
            <div className="flex-1 w-full flex items-center justify-center p-2 bg-gray-50">
                {/* Fallback por si la imagen no carga de inmediato */}
                <img
                    src={imagePath}
                    alt={name}
                    className="max-h-full max-w-full object-contain drop-shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=?' }}
                />
            </div>
            <div className="w-full bg-white py-2 px-1 border-t-2 border-gray-100">
                <p className="text-[10px] uppercase font-bold text-center text-gray-800 leading-tight">
                    {name}
                </p>
            </div>
        </div>
    );
}
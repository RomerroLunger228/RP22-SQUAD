interface DescriptionProps {
    text: string;
    price: string;
    duration?: string;
    tierType?: 'premium' | 'default';
    onBuyClick?: () => void;
}

export default function MembershipDescription({ text, price, duration = "3 месяца", tierType = 'default', onBuyClick }: DescriptionProps) {
    const lines = text.split('\n');
    const serviceLine = lines.find(line => line.startsWith('Подписка на услугу:'));
    const otherLines = lines.filter(line => !line.startsWith('Подписка на услугу:') && line.trim() !== '');

    const tierColors = tierType === 'premium' 
        ? {
            bg: 'bg-gradient-to-r from-yellow-600/10 to-amber-600/10',
            border: 'border-yellow-500/20',
            text: 'text-yellow-400'
          }
        : {
            bg: 'bg-gradient-to-r from-purple-600/10 to-indigo-600/10', 
            border: 'border-purple-500/20',
            text: 'text-purple-400'
          };

    return (
        <div className="mt-4 w-full max-w-[600px] bg-[#101010] border border-gray-700/30 rounded-xl p-6">
            <div className="text-white text-sm leading-relaxed font-montserrat mb-6 space-y-3">
                {serviceLine && (
                    <div className={`${tierColors.bg} ${tierColors.border} border rounded-lg p-3 mb-4`}>
                        <p className={`${tierColors.text} font-semibold text-center`}>
                            Подписка на услугу
                        </p>
                        <p className="text-white font-bold text-center text-base mt-1">
                            {serviceLine.replace('Подписка на услугу: ', '')}
                        </p>
                    </div>
                )}
                <div className="space-y-2">
                    {otherLines.map((line, index) => (
                        <p key={index} className="text-gray-300 flex items-start">
                            {line.startsWith('•') ? (
                                <>
                                    <span className="text-green-400 mr-2">✓</span>
                                    <span>{line.replace('• ', '')}</span>
                                </>
                            ) : (
                                line
                            )}
                        </p>
                    ))}
                </div>
            </div>
            <button 
                onClick={onBuyClick}
                className="w-full bg-gradient-to-r from-white to-gray-100 text-black font-semibold py-3 px-6 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-all duration-200 text-md shadow-lg"
            >
                Купить за {price}zł / {duration}
            </button>
        </div>
    )
}
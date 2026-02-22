interface Highlight {
  id: number;
  title: string;
}

interface ProfileHighlightsProps {
  highlights?: Highlight[];
}

export default function ProfileHighlights({ highlights }: ProfileHighlightsProps) {
  const defaultHighlights = [
    { id: 1, title: "Highlight" },
    { id: 2, title: "Highlight" },
    { id: 3, title: "Highlight" },
    { id: 4, title: "Highlight" }
  ];

  const displayHighlights = highlights || defaultHighlights;

  return (
    <div className="flex gap-4 mb-6">
      {displayHighlights.map((highlight) => (
        <div key={highlight.id} className="text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L15 9H22L17 14L19 22L12 18L5 22L7 14L2 9H9L12 2Z"/>
            </svg>
          </div>
          <p className="text-xs text-gray-400">{highlight.title}</p>
        </div>
      ))}
    </div>
  );
}
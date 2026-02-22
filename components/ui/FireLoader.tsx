'use client';

interface FireLoaderProps {
  isVisible?: boolean;
  text?: string;
}

export default function FireLoader({ isVisible = true, text = "Loading..." }: FireLoaderProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8">
        {/* Fire Circle Loader */}
        <div className="relative">
          {/* Simple bright circle */}
          <div className="simple-circle"></div>
          
          {/* Simple flame particles */}
          <div className="flames-container">
            <div className="flame flame-1"></div>
            <div className="flame flame-2"></div>
            <div className="flame flame-3"></div>
            <div className="flame flame-4"></div>
            <div className="flame flame-5"></div>
            <div className="flame flame-6"></div>
            <div className="flame flame-7"></div>
            <div className="flame flame-8"></div>
          </div>
        </div>
        
        {/* Loading text */}
        {text && (
          <div className="text-white text-lg font-medium tracking-wider animate-pulse">
            {text}
          </div>
        )}
      </div>

      <style jsx>{`
        .simple-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        .flames-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 140px;
          height: 140px;
          animation: spin 2s linear infinite;
        }

        .flame {
          position: absolute;
          width: 8px;
          height: 20px;
          background: #ffffff;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        }

        .flame-1 {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
        }

        .flame-2 {
          top: 14px;
          right: 14px;
        }

        .flame-3 {
          top: 50%;
          right: 0;
          transform: translateY(-50%);
        }

        .flame-4 {
          bottom: 14px;
          right: 14px;
        }

        .flame-5 {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
        }

        .flame-6 {
          bottom: 14px;
          left: 14px;
        }

        .flame-7 {
          top: 50%;
          left: 0;
          transform: translateY(-50%);
        }

        .flame-8 {
          top: 14px;
          left: 14px;
        }

        @keyframes spin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
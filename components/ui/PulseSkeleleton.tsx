const PulseSkeleton = () => (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="h-7 w-6 bg-gradient-to-r from-gray-900 to-black rounded-lg animate-pulse" />
        <div className="absolute inset-0 rounded-lg  animate-pulse" />
      </div>
    </div>
  );


export function PulseMap(){
    return (
        
            <div className="relative w-full p-[1px]">
                <div className="h-30 w-full bg-gradient-to-r from-gray-900 to-black rounded-lg animate-pulse" />
                <div className="absolute inset-0 rounded-lg  border border-gray-100/30 animate-pulse" />
            </div>
        
    )
}

export default PulseSkeleton
import { BookingStep } from "@/types/booking";

// components/mobile/MobileStepper.tsx
interface MobileStepperProps {
  currentStep: BookingStep;
  serviceSelected: boolean;
  dateTimeSelected: boolean;
}

// components/mobile/MobileStepper.tsx
interface MobileStepperProps {
  currentStep: BookingStep;
}

export function MobileStepper({ currentStep }: MobileStepperProps) {
  return (
    <div className="w-full px-4 py-4">
      <div className="flex items-center justify-between relative">
        {/* Линия прогресса */}
        <div className="absolute top-3 left-0 right-0 h-[2px] bg-[#222222] -z-10" />
        <div 
          className="absolute top-3 left-0 h-[2px] bg-white transition-all duration-300 -z-10"
          style={{ 
            width: currentStep === 1 ? '0%' : 
                   currentStep === 2 ? '50%' : '100%' 
          }}
        />
        
        {/* Точка 1 */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          currentStep >= 1 ? 'bg-white border-white text-black' : 'bg-transparent border-[#333333] text-white'
        }`} >1</div>
        
        {/* Точка 2 */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          currentStep >= 2 ? 'bg-white border-white text-black' : 'bg-transparent border-[#333333] text-white'
        }`} >2</div>
        
        {/* Точка 3 */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          currentStep >= 3 ? 'bg-white border-white text-black' : 'bg-transparent border-[#333333] text-white'
        }`} >3</div>
      </div>
    </div>
  );
}
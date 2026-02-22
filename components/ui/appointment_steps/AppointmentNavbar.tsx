import { cn } from "@/lib/utils"

export default function AppointmentNavbar({currentStep}: {currentStep: number}) {
    

    return (
        <div className="w-full bg-black mb-4 rounded-[72px] p-1.5 h-12 flex items-center justify-between">
            <div className={cn("h-full w-[112px] flex items-center justify-center rounded-[24px]", currentStep === 1 ? "bg-white text-black" : "bg-transparent text-white")}>
                <h2 className="font-outfit font-medium text-[14px] font-montserrat">Сервисы</h2>
            </div>
            <div className={cn("h-full w-[112px] flex items-center justify-center rounded-[24px]", currentStep === 2 ? "bg-white text-black" : "bg-transparent text-white")}>
                <h2 className="font-outfit font-medium text-[14px] font-montserrat">Дата</h2>
            </div>
            <div className={cn("h-full w-[112px] flex items-center justify-center rounded-[24px]", currentStep === 3 ? "bg-white text-black" : "bg-transparent text-white")}>
                <h2 className="font-outfit font-medium text-[14px] font-montserrat">Оплата</h2>
            </div>

        </div>
    )
}
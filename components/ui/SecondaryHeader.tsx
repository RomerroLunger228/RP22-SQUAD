"use client";


import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";


interface SecondaryHeaderProps {
    title?: string;
    subtitle?: string;
}

export default function SecondaryHeader({ title, subtitle }: SecondaryHeaderProps){
    const router = useRouter();
    const handleBack = () => {
        router.back();
    }
    return (
        <div className="sticky top-0 z-50 bg-[#111213] border-b border-[#222222] px-4 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">

            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors">
                <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            
            <div>
                <h1 className="text-2xl font-montserrat font-semibold text-white">{title}</h1>
                <p className="text-[#BBBDC0] text-sm font-montserrat">{subtitle}</p>
            </div>
            </div>
        </div>
    )
}
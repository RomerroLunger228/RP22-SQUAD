"use client";

import Link from "next/link";
import { IdentifierIcon, MapIcon } from "../icons/Icons";
import "./AdditionalInfo.css";




export default function AdditionalInfo() {

  return (
    <div className="flex flex-row items-center justify-between mt-4 w-full">
      
      {/* ЛОКАЦИЯ — СЛЕВА */}
      <div className="h-[132px] w-[48%] bg-[#000000] rounded-[16px] p-4 drop-shadow-lg relative overflow-hidden location-card">
        {/* ВНУТРЕННЯЯ ВОЛНА */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent wave-animation" />
        <Link href="https://maps.app.goo.gl/xQihYzB5VvGz2i7z8" target="_blank">
          <div className="relative z-10 flex flex-col items-center gap-2 justify-center pt-2">
            <MapIcon />
            <span className="text-[16px] font-montserrat font-medium leading-[20px]">
              Локация
            </span>
          </div>
        </Link>
        </div>

      {/* ПОДПИСКА — СПРАВА */}
      <div className="w-[48%] subscription-card">
        <Link href="/subscription">
          <div className="h-[132px] w-full bg-[#000000] rounded-[16px] p-4 drop-shadow-lg relative overflow-hidden">
            
            {/* ВНУТРЕННЯЯ ВОЛНА */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent wave-animation wave-delay" />

            <div className="relative z-10 flex flex-col items-center gap-2 justify-center pt-2">
              <IdentifierIcon />
              <span className="text-[16px] font-montserrat font-medium leading-[20px]">
                Подписка
              </span>
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}

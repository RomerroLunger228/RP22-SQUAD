"use client";

import { IconQuestionMark } from "../icons/Icons";

export default function CardPointComponent({
  userPoints,
}: {
  userPoints?: number;
}) {
  return (
    <div className="w-full h-32 bg-gradient-to-br from-[#6B8B6B] via-[#5A7A5A] via-[#4A6A4A] to-[#3A5A3A] rounded-[16px] p-6 flex items-center justify-center flex-col mt-4 drop-shadow-lg relative overflow-hidden">
      
      {/* ПЛАВАЮЩИЙ БЛИК СЛЕВА */}
      <div className="absolute -bottom-16 -left-16 w-[230px] h-[150px] bg-white/45 rounded-full blur-2xl animate-float-left" />

      {/* ПЛАВАЮЩИЙ БЛИК СПРАВА */}
      <div className="absolute -top-16 -right-16 w-[230px] h-[150px] bg-white/40 rounded-full blur-2xl animate-float-right" />

      {/* СВЕТОВАЯ ВОЛНА */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-light-wave" />

      {/* КОНТЕНТ */}
      <div className="relative z-10 w-full h-full flex items-center justify-center flex-col">
        
        <div className="w-full flex justify-start">
          <div className="flex items-center gap-1">
            <p className="text-[16px] font-medium leading-[20px] text-black">
              Points earned
            </p>
            <IconQuestionMark />
          </div>
        </div>

        <div className="w-full flex flex-row items-center justify-between">
          
          {/* ПОИНТЫ ИЗ ГЛУБИНЫ */}
          <div className="animate-points-appear" style={{ animationDelay: '0.4s' }}>
            <span className="text-[40px] font-medium text-black">
              {userPoints ?? 0}
            </span>
            <span className="text-[16px] ml-1 text-black">
              points
            </span>
          </div>

          {/* КНОПКА */}
          <div className="animate-fadeUp" style={{ animationDelay: '0.6s' }}>
            <button className="px-3 py-[10px] border-[1.25px] border-black/15 rounded-[100px] flex items-center justify-center">
              <span className="text-[14px] font-md leading-[16px] text-black">
                Сoming soon
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}


export function CardPoints(){
    return (
        <div className="w-full h-16 bg-gradient-to-br from-[#A8B8A8] via-[#8FA58F] via-[#7A9A7A] to-[#6B8B6B] rounded-[16px] py-5 px-6 flex items-center justify-center flex-col mt-4 drop-shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(80,100,80,0.6)_0%,transparent_50%),radial-gradient(circle_at_80%_75%,rgba(80,100,80,0.6)_0%,transparent_50%),radial-gradient(circle_at_80%_60%,rgba(85,105,85,0.5)_0%,transparent_45%),radial-gradient(circle_at_20%_40%,rgba(85,105,85,0.5)_0%,transparent_45%),radial-gradient(circle_at_45%_85%,rgba(70,90,70,0.55)_0%,transparent_40%),radial-gradient(circle_at_55%_15%,rgba(70,90,70,0.55)_0%,transparent_40%)] rounded-[16px]"></div>
            <div className="relative z-10 w-full h-full flex items-center justify-center flex-col">
            
            <div className="w-full flex flex-row items-center justify-between">
                <div className="w-full flex justify-start ">
                <div className="flex items-center gap-1">
                        <p className="text-[18px] font-medium leading-[24px] text-black">
                            Your points
                        </p>
                        
                    </div>
                    
                </div>
                <div className="">
                    <span className="text-[24px] font-medium text-black leading-[32px]">
                        82
                    </span>
                    <span className="text-[14px] leading-[20px] ml-1 text-black">
                        pts
                    </span>
                </div>
                {/* <div>
                    <button className="px-3 py-[10px] border-[1.25px] border-white/20 rounded-[100px] flex items-center justify-center">
                        <span className="text-[14px] font-md leading-[16px] text-black">Exchange</span>
                        
                    </button>
                </div> */}
            </div>
            </div>
        </div>
    )
}
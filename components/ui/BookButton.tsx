"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function BookButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: "backOut",
        delay: 0.8,
      }}
    >
      <Link href="/appointment">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="w-full h-[56px] bg-[#FFFFFF] rounded-[12px] flex items-center justify-center mt-6 mb-4"
        >
          <span className="text-[18px] font-montserrat font-bold leading-[24px] text-[#000000]">
            Записаться
          </span>
        </motion.button>
      </Link>
    </motion.div>
  );
}


export function ProfileButton(){
    return (
        <Link href="/appointment">
            <button className="w-full h-[56px] bg-[#1A1A1A] border-[#ffffff]/10 border-[1px] rounded-[12px] flex items-center justify-center">
                <span className="text-[18px] font-montserrat font-bold leading-[24px] text-[#ffffff]">
                    Записаться
                </span>
            </button>
        </Link>
    )
}
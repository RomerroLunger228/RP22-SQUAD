"use client";

import { motion } from "framer-motion";

interface VisitCardProps {
  serviceName: string;
  date: string;
  time: string;
  points: number;
  index: number;
}

export default function VisitCard({
  serviceName,
  date,
  time,
  points,
  index,
}: VisitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: index * 0.01,
      }}
      whileTap={{ scale: 0.97 }}
      className="w-full flex items-center justify-between h-24 bg-[#000000] rounded-[16px] p-4"
    >
      <div className="flex flex-col">
        <span className="text-[17px] font-montserrat font-medium tracking-tight">
          {serviceName}
        </span>
        <span className="text-[16px] text-[#BBBDC0] font-montserrat">
          {date} • {time}
        </span>
      </div>

      <span className="text-[#7CB895] text-[16px] font-medium">
        +{points}pts
      </span>
    </motion.div>
  );
}

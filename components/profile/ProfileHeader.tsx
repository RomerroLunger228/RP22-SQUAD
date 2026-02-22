"use client";

import { motion } from "framer-motion";
import { IconUser } from "@/components/icons/Icons";
import Image from "next/image";

interface ProfileHeaderProps {
  username: string;
  userLogo: string | undefined | null;
}

export default function ProfileHeader({ username, userLogo }: ProfileHeaderProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-[#555555] to-[#777777] rounded-full flex items-center justify-center overflow-hidden">
          {userLogo ? (
            <Image
              src={userLogo}
              alt={username}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <IconUser className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-outfit font-bold text-white">
            @{username || "Профиль"}
          </h1>
         
        </div>
      </div>
    </motion.div>
  );
}
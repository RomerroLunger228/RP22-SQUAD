import { User } from "@/types/admin";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminRandomizerProps {
  users: User[];
}

export default function AdminRandomizer({ users }: AdminRandomizerProps) {
  const [category, setCategory] = React.useState("all");
  const [user, setUser] = React.useState<User | null>(null);
  const [animating, setAnimating] = React.useState(false);

  const randomizeUsers = () => {
    let list = users;

    if (category !== "all") {
      list = users.filter(user => {
        if (category === 'no-subscription') {
          return !user.subscription;
        }
        if (category === 'default') {
          const subscriptionStr = user.subscriptionTier?.toLowerCase() || '';
          return subscriptionStr.includes('default');
        }
        if (category === 'premium') {
          const subscriptionStr = user.subscriptionTier?.toLowerCase() || '';
          return subscriptionStr.includes('premium');
        }
        return true;
      });
    }

    if (!list.length) return;

    setAnimating(true);

    setTimeout(() => {
      setUser(list[Math.floor(Math.random() * list.length)]);
      setAnimating(false);
    }, 500);
  };

  return (
    <>
      <div className="flex flex-col items-center mt-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mb-4 px-4 py-2 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] text-white"
        >
          <option value="all">Все пользователи</option>
          <option value="default">Default подписки</option>
          <option value="premium">Premium подписки</option>
          <option value="no-subscription">Без подписки</option>
        </select>
      </div>

      <div className="flex justify-center flex-col items-center">
        {/* СТАТИЧНЫЙ КОНТЕЙНЕР */}
        <div className="relative overflow-hidden flex items-center justify-center w-full h-32 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 rounded-lg border p-4">
          
          {/* ВОЛНА 1 */}
          <AnimatePresence>
            {animating && (
              <motion.div
                initial={{ x: "-120%" }}
                animate={{ x: "120%" }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent"
              />
            )}
          </AnimatePresence>

          {/* ВОЛНА 2 (задержка) */}
          <AnimatePresence>
            {animating && (
              <motion.div
                initial={{ x: "-140%" }}
                animate={{ x: "140%" }}
                transition={{
                  duration: 0.8,
                  delay: 0.1,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent"
              />
            )}
          </AnimatePresence>

          {/* КОНТЕНТ */}
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            <AnimatePresence mode="wait">
              {user ? (
                <motion.div
                  key={user.username}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="text-center"
                >
                  <h3 className="text-xl font-semibold text-white">
                    @{user.username}
                  </h3>
                </motion.div>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/80 text-center"
                >
                  Нажмите кнопку, чтобы выбрать пользователя
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={randomizeUsers}
          className="mt-4 px-4 py-2 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]"
        >
          Случайный пользователь
        </button>
      </div>
    </>
  );
}

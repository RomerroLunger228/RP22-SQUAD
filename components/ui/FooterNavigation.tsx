"use client"

import { DealsIcon, HomeIcon, UserIcon } from "../icons/Icons"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function FooterNavigation(){
    const pathname = usePathname()
    
    const isActive = (path: string) => {
        if (path === '/') {
            return pathname === '/'
        }
        return pathname.startsWith(path)
    }

    return (
        <footer className="h-20 w-full flex items-center justify-between bg-[#000000] px-8 py-4 fixed bottom-0 left-0 right-0 z-50 transform-gpu will-change-transform telegram-footer">
            <Link href={"/"}>
                <div className="flex flex-col items-center gap-0">
                    <HomeIcon />
                    <span className={`${isActive('/') ? 'text-white' : 'text-gray-500'}`}>Home</span>
                </div>
            </Link>
            
            
            <Link href={"/deals"}>
                <div className="flex flex-col items-center gap-0">
                    <DealsIcon />
                    <span className={`${isActive('/deals') ? 'text-white' : 'text-gray-500'}`}>Deals</span>
                </div>
            </Link>
                
            
            <Link href={"/profile"}>
                <div className="flex flex-col items-center gap-0">
                    <UserIcon />
                    
                        <span className={`${isActive('/profile') ? 'text-white' : 'text-gray-500'}`}>Profile</span>
                    
                </div>
            </Link>
        </footer>
    )
}
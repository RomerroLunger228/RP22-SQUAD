import { IconBell } from "../icons/Icons";
import ButtonWrapper from "./ButtonWrapper";
import Link from "next/link";

export default function Navbar({username}: {username?: string}) {
    return (
        <div className="w-full flex items-center justify-between">
            <div className="flex flex-col gap-0">
                <div>
                    <span className="text-[20px] font-montserrat">Привет! {username}</span>
                </div>
                <div>
                    <span className="text-[16px] text-[#BBBDC0]">Updated now</span>
                </div>
            </div>
            <div>
                <Link href="/appointments">
                    <ButtonWrapper>
                        <IconBell />
                    </ButtonWrapper>
                </Link>
            </div>
        </div>
    )
}
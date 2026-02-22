interface iAppProps {
    children: React.ReactNode;
}



export default function ButtonWrapper({children}: iAppProps){
    return (
        <button className="border border-white/20 rounded-[12px] flex items-center justify-center border-[1.25px]">
            {children}
        </button>
    )
}
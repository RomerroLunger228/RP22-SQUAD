
import SecondaryHeader from "../SecondaryHeader";
import SubscriptionPlansGrid from "./SubscriptionPlansGrid";

export default function SubscriptionPage() {
    return (
        <>
            <SecondaryHeader title="Подписки" subtitle="Выберите подходящий план подписки"/>
            <div className="p-4 bg-black/40">
                <SubscriptionPlansGrid />
            </div>
        </>
    )
}
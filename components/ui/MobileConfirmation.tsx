
"use client";

import { BookingData } from "@/types/booking";
import { MobileConfirmationContainer } from "./MobileConfirmationContainer";

interface MobileConfirmationProps {
  bookingData: BookingData;
  onConfirm: (paymentMethod: string) => void;
  onBack: () => void;
}


export function MobileConfirmation(props: MobileConfirmationProps) {
  return <MobileConfirmationContainer {...props} />;
}



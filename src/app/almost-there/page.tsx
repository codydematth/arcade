import type { Metadata } from "next";
import { AlmostThereGame } from "@/components/almost-there-game";

export const metadata: Metadata = {
  title: "Almost There",
  description:
    "A one-button jump game that looks fair until the last platform. Film the fail. Share the link.",
};

export default function AlmostTherePage() {
  return <AlmostThereGame />;
}

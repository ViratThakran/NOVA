import type { Metadata } from "next";
import { WhatWeThinkView } from "@/components/marketing/what-we-think-view";

export const metadata: Metadata = {
  title: "NOVA — What We Think",
  description: "Research, ideas and perspectives on technology, people, learning and the future we're building.",
};

export default function WhatWeThinkPage() {
  return <WhatWeThinkView />;
}

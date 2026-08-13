import { redirect } from "next/navigation";

// "Get Started" is the signup entry point — route straight into registration
// rather than duplicating a second copy of the same form at this URL.
export default function GetStartedPage() {
  redirect("/auth/register");
}

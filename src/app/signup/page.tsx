import { redirect } from "next/navigation";

// Self-service signup has been retired — schools are now set up directly by
// the platform team. Anyone landing on this URL (old links/bookmarks) is
// sent to sign in instead.
export default function SignupPage() {
  redirect("/login");
}

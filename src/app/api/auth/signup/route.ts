import { NextResponse } from "next/server";

// Self-service signup has been retired — schools are now set up directly by
// the platform team via the super-admin panel.
export async function POST() {
  return NextResponse.json({ error: "Self-service signup is no longer available. Contact us to get set up." }, { status: 410 });
}

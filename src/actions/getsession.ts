import { NextResponse } from "next/server";
import { auth } from "@/auth";


export async function getsession() {
    const session = await auth();
    console.log("Session in getsession action:", session);
    if (!session) {
        return NextResponse.json({ error: "No active session" }, { status: 401 });
    }
    else {
        console.log("Active session found:", session);
    }
    return NextResponse.json(session, {status: 200});
}
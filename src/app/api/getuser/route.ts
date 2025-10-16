'use server'
import { NextResponse } from "next/server";
import { auth } from "@/auth";


export async function GET() {
    const session = await auth();
    const data = session?.user || null;
    console.log("GET /api/getuser session:", data);
    return NextResponse.json(data, {status: 200});
}
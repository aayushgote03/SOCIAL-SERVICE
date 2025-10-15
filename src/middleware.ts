import { NextResponse, type NextRequest } from "next/server";



export async function middleware(req: NextRequest) {
    
    console.log(req.nextUrl);
    const res = NextResponse.next();
    res.headers.append('ACCESS-CONTROL-ALLOW-ORIGIN', '*');
    res.headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res;
}

export const config = {
    matcher: ['/api/:path*']
}
  
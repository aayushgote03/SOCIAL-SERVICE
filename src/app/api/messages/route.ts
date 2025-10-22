import { NextResponse } from 'next/server'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: "1945347",
  key: "72cb3b6362c5dc77cc6e",
  secret: "d8f962196983a5f7644b",
  cluster: "ap2",
  useTLS: true, 
});

export async function POST(request: Request) {
  const { message } = await request.json()

  await pusher.trigger('chat-channel', 'new-message', {
    message,
  })

  return NextResponse.json({ success: true })
}
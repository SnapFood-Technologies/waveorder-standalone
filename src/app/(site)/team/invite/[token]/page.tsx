// app/(site)/team/invite/[token]/page.tsx
import type { Metadata } from 'next'
import AcceptInvitation from '@/components/team/AcceptInvitation'

export const metadata: Metadata = {
  title: 'Accept Team Invitation - WaveOrder',
  description: 'Join your team on WaveOrder and start managing orders together.',
  robots: {
    index: false,
    follow: false,
  }
}

export default async function TeamInvitePage({ 
  params 
}: { 
  params: Promise<{ token: string }> 
}) {
  const { token } = await params
  return <AcceptInvitation token={token} />
}
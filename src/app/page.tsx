import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'
import LandingPage from '@/components/landing-page'

export default async function Home() {
  // We can still check session if we want to change CTA states,
  // but for now, we'll just return the LandingPage.
  // The LandingPage has links to /login, which handles redirects natively
  // if the user is already logged in.

  return <LandingPage />
}

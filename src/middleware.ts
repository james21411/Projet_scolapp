import { NextResponse, type NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'
 
export async function middleware(request: NextRequest) {
  // Middleware temporairement désactivé pour résoudre le problème de redirection infinie
  return NextResponse.next()
  
  /*
  try {
    // Vérifier si l'utilisateur est sur une page publique
    const publicPages = ['/login', '/logout', '/api/test-session']
    const isPublicPage = publicPages.includes(request.nextUrl.pathname)
    
    // Si c'est une page publique, permettre l'accès
    if (isPublicPage) {
      return NextResponse.next()
    }
    
    // Pour les autres pages, vérifier la session
    try {
      const session = await getIronSession<SessionData>(request.cookies, sessionOptions)
      const { isLoggedIn, role } = session || {}
      
      if (!isLoggedIn) {
        // Rediriger vers login si pas connecté
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      // Vérifier que le rôle est valide
      const validRoles = ['Admin', 'Direction', 'Comptable', 'Enseignant', 'Parent', 'Élève']
      if (!validRoles.includes(role)) {
        console.error('Rôle invalide dans la session:', role)
        // Rediriger vers login si le rôle est invalide
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
    } catch (sessionError) {
      console.error('Erreur de session:', sessionError)
      // En cas d'erreur de session, rediriger vers login
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    return NextResponse.next()
    
  } catch (error) {
    console.error('Erreur dans le middleware:', error)
    // En cas d'erreur, rediriger vers login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  */
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logout (logout page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logout).*)',
  ],
}

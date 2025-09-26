// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'
import { sendMagicLinkEmail } from '@/lib/email'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // Magic Link Email Provider
    EmailProvider({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        })
        
        if (!existingUser) {
          throw new Error('No account found with this email address. Please sign up first.')
        }
        try {
          await sendMagicLinkEmail({
            to: email,
            magicLinkUrl: url
          })
        } catch (error) {
          console.error('Failed to send magic link email:', error)
          throw new Error('Failed to send magic link email')
        }
      }
    }),

    // Email/Password Provider + Setup Token
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        setupToken: { label: 'Setup Token', type: 'text' }
      },
      async authorize(credentials) {
        // Handle setup token login
        if (credentials?.setupToken && credentials?.email) {
          const user = await prisma.user.findFirst({
            where: {
              email: credentials.email.toLowerCase(),
              setupToken: credentials.setupToken,
              setupExpiry: { gt: new Date() }
            }
          })

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role
            }
          }
          return null
        }

        // Handle regular email/password login
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        }
      }
    })
  ],

  session: {
    strategy: 'jwt'
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify-email'
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
        token.role = user.role
        
        // Add business info during initial login
        try {
          const business = await prisma.business.findFirst({
            where: { userId: user.id },
            select: {
              id: true,
              setupWizardCompleted: true,
              onboardingCompleted: true
            }
          })
          
          if (business) {
            token.businessId = business.id
            token.setupCompleted = business.setupWizardCompleted
            token.onboardingCompleted = business.onboardingCompleted
          } else {
            token.businessId = null
            token.setupCompleted = false
            token.onboardingCompleted = false
          }
        } catch (error) {
          console.error('Error fetching business status during login:', error)
          // Set safe defaults if business query fails
          token.businessId = null
          token.setupCompleted = false
          token.onboardingCompleted = false
        }
      }
      
      if (token.id) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { 
              id: true, 
              email: true, 
              name: true, 
              image: true,
              role: true
            }
          })
          
          if (freshUser) {
            token.id = freshUser.id
            token.email = freshUser.email
            token.name = freshUser.name
            token.image = freshUser.image
            token.role = freshUser.role
          }
        } catch (error) {
          console.error('Error fetching fresh user data:', error)
        }
      }
      
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string
        session.user.role = token.role as string
        session.user.businessId = token.businessId as string | null
        session.user.setupCompleted = token.setupCompleted as boolean
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
      }
      return session
    },

    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                name: user.name!,
                email: user.email!.toLowerCase(),
                emailVerified: new Date(),
                image: user.image,
                role: 'BUSINESS_OWNER'
              }
            })

            try {
              const { sendUserCreatedNotification } = await import('@/lib/email')
              await sendUserCreatedNotification({
                userId: newUser.id,
                name: user.name!,
                email: user.email!.toLowerCase(),
                provider: 'google',
                createdAt: newUser.createdAt || new Date()
              })
            } catch (notificationError) {
              console.error('Failed to send user registration notification:', notificationError)
            }

            existingUser = newUser
          }
          
          user.id = existingUser.id
          user.role = existingUser.role
        } catch (error) {
          console.error('Error handling Google sign-in:', error)
          return false
        }
      }

      return true
    }
  },

  events: {
    async createUser({ user }) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id }
        })

        if (existingUser && !existingUser.role) {
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              role: 'BUSINESS_OWNER'
            }
          })
        }
      } catch (error) {
        console.error('Error in createUser event:', error)
      }
    }
  },

  debug: process.env.NODE_ENV === 'development',
}
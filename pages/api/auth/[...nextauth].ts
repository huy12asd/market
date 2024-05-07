import NextAuth,{ NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcrypt';

import prisma from '@/lib/prismadb';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers:[
        GoogleProvider({
            clientId: process.env.GOOGLE_ID_KEY as string,
            clientSecret: process.env.GOOGLE_SECRET_KEY as string,
        }),
        CredentialsProvider({
          name: 'credentials',
          credentials: {
            email: { label: 'email', type: 'text' },
            password: { label: 'password', type: 'password' }
          },
          async authorize(credentials,req) {
            if (!credentials?.email || !credentials?.password) {
              throw new Error('Invalid credentials');
            }
    
            const user = await prisma.user.findUnique({
              where: {
                email: credentials.email
              }
            });
    
            if (!user || !user?.hashedPassword) {
              throw new Error('Invalid credentials');
            }
    
            const isCorrectPassword = await bcrypt.compare(
              credentials.password,
              user.hashedPassword
            );
    
            if (!isCorrectPassword) {
              throw new Error('Invalid credentials');
            }
            return user;
          }
        })
    ],
    
    debug: process.env.NODE_ENV === 'development',
    session: {
      strategy: 'jwt',
    },
    
    jwt: {
      secret: process.env.NEXTAUTH_JWT_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
    
  }
  
export default NextAuth(authOptions);

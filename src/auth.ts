import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials" // Import the NextAuthConfig type
import bcrypt from 'bcryptjs'


// --- IMPORTANT: Ensure these imports point to your actual files ---
// Assuming these are located at the root or correctly aliased:
import { connectDB } from "./lib/db" 
import { UserModel } from "./models/User" 

// --- 1. Define the core configuration object ---
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
   Credentials({
      name: "Credentials",
      // Define the fields expected from the login form
      credentials: {
          email: { label: 'Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        // If credentials are not provided (e.g., empty form), return null immediately
        if (!credentials || !credentials.email || !credentials.password) return null;

        try {
          await connectDB(); // Ensure DB connection is active

          // 1. Find user by email (using case-insensitive search best practice)
          let user = await UserModel.findOne({
            email: (credentials.email as string).toLowerCase()
          }).select('+passwordHash'); // Select the passwordHash explicitly if your schema excludes it by default

          if (!user) {
            // User not found, log for debugging and return null to NextAuth
            console.log('Authorization Failed: User not found for email:', credentials.email);
            return null;  
          }

          // 2. Compare the plain password with the stored hash
          const isMatch = await bcrypt.compare(
              credentials.password as string,
              user.passwordHash as string // Use the correct field name from your schema
          );

          if (isMatch) {
              console.log('Authorization Success');
           
 
              
              // 3. Return a minimal user object required by NextAuth
              return {
                  
                  email: user.email,
                  name: user.displayName, // Using displayName as the name field
                  // Add other non-sensitive fields here if needed in session/token
              };
          } else {
              console.log('Authorization Failed: Password mismatch');
              return null; // Incorrect password
          }
        } catch (error) {
          // Log error details and return null to prevent login
          console.error('AUTHORIZE UNHANDLED ERROR:', error);
          return null; 
        }
      },
    }),
  ],
  // Set the session strategy to JWT for stateless serverless functions
});
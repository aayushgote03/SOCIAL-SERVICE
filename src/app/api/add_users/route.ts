import { NextResponse } from 'next/server';
import { signUpUser } from '@/actions/user_signup'; // Import your signUpUser Server Action

// Mock data that mirrors the SignUpData interface
const mockUserData = {
    displayName: "shruti",
    email: "shrut@email.com",
    password: "shruti@123",
    location: "Nagpur, India",
    causeFocus: "environment",
    skills: "Event Coordination, nurse",
  };

/**
 * Handles a POST request to test the signUpUser Server Action.
 */
export async function GET() {
    console.log("--- Testing signUpUser Server Action Directly ---");

    // In a real API route, you would parse the body: 
    // const userData = await request.json(); 
    
    // For this test, we use the static mock data:
    const userDataToTest = mockUserData;

    // 1. Call the Server Action directly
    const result = await signUpUser(userDataToTest);

    // 2. Return the result object as a JSON response
    if (result.success) {
        return NextResponse.json({ 
            status: 'success', 
            user_tested: userDataToTest.email,
            server_response: result.message
        }, { status: 201 }); // 201 Created status
    } else {
        return NextResponse.json({ 
            status: 'failure', 
            user_tested: userDataToTest.email,
            error: result.message 
        }, { status: 400 }); // 400 Bad Request status
    }
}

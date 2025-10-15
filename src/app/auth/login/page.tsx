'use client';
import React, { useState } from 'react';
import { signIn } from "next-auth/react";
import { Mail, LockKeyhole, Loader2, LogIn, User, Facebook, Twitter, Chrome, Link } from 'lucide-react';

// 1. Define the Message interface for displaying status feedback
interface Message {
  type: 'success' | 'error';
  text: string;
}

// 2. Define the props interface for the reusable InputField component
interface InputFieldProps {
  Icon: React.ElementType; // Type for Lucide icons
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Explicitly type the change event
  // Optional: Add a copy icon/button next to the field, like in the image
  hasUtilityIcon?: boolean; 
}

// Component for input field with an icon (now typed with InputFieldProps)
const InputField: React.FC<InputFieldProps> = ({ Icon, type, placeholder, value, onChange, hasUtilityIcon = false }) => (
  <div className="relative mb-6">
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
      {/* Icon is rendered using the passed React component */}
      <Icon className="w-5 h-5" />
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      // Updated: Use a very light blue background and green focus ring
      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-blue-50 focus:ring-green-500 focus:border-green-500 transition duration-150 shadow-sm"
    />
    {/* Optional Utility Icon (like the one shown in the design image for copy/utility) */}
    {hasUtilityIcon && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-green-600 cursor-pointer">
            {/* The image shows a square icon, using a generic Copy icon to represent utility */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
        </div>
    )}
  </div>
);

// Main application component (explicitly typed as a functional component)
const App: React.FC = () => {
  // Use explicit types for useState calls
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null); // Use the defined Message interface

  // Simulated login attempt (explicitly type the form event)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // Simulate an API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));


    if ((usernameOrEmail || usernameOrEmail ) && password.length >= 6) {
      setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      try {
        const result = await signIn('credentials', {
          redirect: false,
          email: usernameOrEmail,
          password: password,
        });

        console.log('SignIn result:', result);

        if (result?.error) {
          setMessage({ type: 'error', text: 'Invalid username/email or password.' });
        } else {
          setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
          // Optionally redirect or perform other actions on success
        }
      }
      catch (error) {
        console.error('Login error:', error);
        setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
      }
    } else {
      setMessage({
        type: 'error',
        text: 'password must be at least 6 characters long.'
      });
    }

    setLoading(false);
  };
  
  // Custom component for social login buttons
  const SocialButton: React.FC<{ Icon: React.ElementType, bgColor: string, iconColor: string }> = ({ Icon, bgColor, iconColor }) => (
    <button
        type="button"
        className={`w-10 h-10 flex items-center justify-center rounded-lg shadow-md transition duration-200 ${bgColor} hover:opacity-90`}
    >
        <Icon className={`w-5 h-5 ${iconColor}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      {/* Login Card (Two-Column Layout) */}
      <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 grid md:grid-cols-2 gap-8">
        
        {/* === LEFT COLUMN: Illustration & Side Link === */}
        {/* Updated: Light Green/Blue gradient background for fresh feel */}
        <div className="flex flex-col items-center justify-between p-6 bg-gradient-to-br from-blue-50 to-green-100 rounded-xl">
            {/* Placeholder for the Illustration Image */}
            <div className="w-full flex justify-center pt-8">
                {/* Using a placeholder image URL for the visual element */}
                <img 
                    src="https://placehold.co/300x300/e0f2fe/1e40af?text=Community+Welcome" 
                    alt="Man sitting with laptop" 
                    className="max-w-xs h-auto rounded-lg shadow-lg"
                    onError={(e) => {
                        // Fallback in case placeholder fails
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; 
                        target.src = 'https://placehold.co/300x300/e0f2fe/1e40af?text=Community+Welcome';
                    }}
                />
            </div>
            
            {/* Footer Link matching the design image */}
            <Link
                href='/auth/signup'
                // Updated: Green link color
                className="mt-8 text-green-600 hover:text-green-800 font-medium text-sm transition duration-150 border-b border-green-600"
            >
                Create an accountht 
            </Link>
            
        </div>

        {/* === RIGHT COLUMN: Form === */}
        <div className="flex flex-col justify-center p-6">
          <div className="text-left mb-8">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Log in
            </h1>
            <p className="text-gray-500 mt-2">
              Access your community dashboard.
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-4 mb-6 rounded-xl text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700' // Success in green
                  : 'bg-red-100 text-red-700'
              } transition-opacity duration-300`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            {/* Username/Email Input */}
            <InputField
              Icon={User}
              type="text"
              placeholder="Username or Email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              hasUtilityIcon={true}
            />

            {/* Password Input */}
            <InputField
              Icon={LockKeyhole}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hasUtilityIcon={true}
            />

            {/* Remember Me and Forgot Password Link */}
            <div className="flex items-center justify-between mb-6 text-sm">
                <label className="flex items-center text-gray-600 select-none">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        // Updated: Checkbox uses Green color
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-2">Remember me</span>
                </label>
                <a
                    href="#"
                    // Updated: Forgot Password link uses green hover
                    className="text-gray-500 hover:text-green-600 font-medium"
                >
                    Forgot Password?
                </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold text-white transition duration-300 ease-in-out transform shadow-md ${
                loading
                  // Updated: Loading color is a lighter blue/green mix
                  ? 'bg-green-400 cursor-not-allowed'
                  // Updated: Primary button is Green
                  : 'bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Log in</span>
                </>
              )}
            </button>
          </form>

          {/* Social Login Section */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-gray-500 text-sm font-medium">
              Or login with
            </span>
            <div className="flex space-x-3">
                {/* Facebook and Twitter remain standard colors */}
                <SocialButton Icon={Facebook} bgColor="bg-blue-600" iconColor="text-white" />
                <SocialButton Icon={Twitter} bgColor="bg-gray-800" iconColor="text-white" />
                {/* Chrome (Google) remains standard color */}
                <SocialButton Icon={Chrome} bgColor="bg-red-600" iconColor="text-white" /> 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

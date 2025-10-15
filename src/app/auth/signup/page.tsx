'use client'
import React, { useState } from 'react';
import { Mail, LockKeyhole, User, MapPin, Zap, CheckCircle, Loader2, Heart, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { signUpUser } from '@/actions/user_signup';

// --- TYPE DEFINITIONS ---
interface Message {
  type: 'success' | 'error';
  text: string;
}

interface InputFieldProps {
  Icon: React.ElementType; 
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Reusable Input Field Component
const InputField: React.FC<InputFieldProps> = ({ Icon, type, placeholder, value, onChange }) => (
  <div className="relative mb-4">
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
      <Icon className="w-5 h-5" />
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-blue-50/50 focus:ring-green-500 focus:border-green-500 transition duration-150 shadow-sm text-gray-800"
    />
  </div>
);

// Main Sign Up Component
const App: React.FC = () => {
  // --- State for Sign-Up Form ---
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  
  // --- SOCIAL SERVICE FIELDS STATE ---
  const [causeFocus, setCauseFocus] = useState<string>('');
  const [skills, setSkills] = useState<string>(''); 
  // ----------------------------------------

  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  
  // --- UI State ---
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null); 

  // --- Form Submission Handler ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (!agreedToTerms) {
      setMessage({ type: 'error', text: 'You must agree to the Community Code of Conduct.' });
      return;
    }
    if (!causeFocus) {
        setMessage({ type: 'error', text: 'Please select your primary cause focus.' });
        return;
    }

    setLoading(true);
    // Simulate API call to create user
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Log final data including new fields (in a real app, this goes to the backend)
    console.log({
        displayName,
        email,
        location,
        causeFocus,
        skills,
        agreedToTerms
    });

    const formdata = {
        displayName,
        email,
        password,
        location,
        causeFocus,
        skills
    }

    const result = await signUpUser(formdata);
    if (!result.success) {
        setMessage({ type: 'error', text: result.message });
        setLoading(false);
        return;
    }
    
    // Simulate successful registration
    setMessage({ 
        type: 'success', 
        text: `Welcome, ${displayName}! Account created successfully. Please check your email.` 
    });

    // Reset form (keeping it concise here for demonstration)
    setDisplayName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLocation('');
    setCauseFocus('');
    setSkills('');
    setAgreedToTerms(false);

    setLoading(false);
  };
  
  // Note: I made Cause Focus required in the validation above.
  const isFormValid = displayName && email && password && confirmPassword && causeFocus && agreedToTerms && password === confirmPassword;
  
  const causeOptions = [
    { value: 'environment', label: 'Environment' },
    { value: 'education', label: 'Education' },
    { value: 'health', label: 'Health & Wellness' },
    { value: 'elderly', label: 'Elderly Support' },
    { value: 'local_aid', label: 'Local Community Aid' },
  ];

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      {/* Sign-Up Card (Two-Column Layout) */}
      <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 grid md:grid-cols-2 gap-8">
        
        {/* === LEFT COLUMN: Illustration & Mission Statement === */}
        <div className="flex flex-col items-center justify-between p-6 bg-gradient-to-br from-blue-50 to-green-100 rounded-xl text-center">
            {/* Mission Icon */}
            <Zap className="w-12 h-12 text-green-600 mb-6 mt-4" />

            <h2 className="text-xl font-bold text-gray-800 mb-4">
                Join the Connect Movement
            </h2>

            <p className="text-gray-600 text-sm leading-relaxed mb-auto">
                By joining, you become part of a network committed to positive local change. We ensure every member is verified and shares our core values of respect and support.
            </p>
            
            {/* Trust Signal */}
            <div className="mt-8 flex items-center justify-center text-green-700 font-semibold text-sm">
                <CheckCircle className="w-5 h-5 mr-2" />
                Verified & Secure Platform
            </div>

            {/* Link to Login */}
            <Link
                href="/auth/login"
                className="mt-8 text-blue-600 hover:text-blue-800 font-medium text-sm transition duration-150 border-b border-blue-600"
            >
                Already a member? Log in here.
            </Link>
        </div>

        {/* === RIGHT COLUMN: Sign Up Form === */}
        <div className="flex flex-col justify-center p-6">
          <div className="text-left mb-6">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Sign Up
            </h1>
            <p className="text-gray-500 mt-2">
              Start making a difference today.
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-4 mb-6 rounded-xl text-sm font-medium transition-opacity duration-300 ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignUp}>
            {/* --- AUTHENTICATION FIELDS (SINGLE COLUMN) --- */}
            
            <InputField Icon={User} type="text" placeholder="Public Display Name *" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <InputField Icon={Mail} type="email" placeholder="Email Address *" value={email} onChange={(e) => setEmail(e.target.value)} />
            
            {/* Password Fields */}
            <div className="mt-4">
                <InputField Icon={LockKeyhole} type="password" placeholder="Create Password *" value={password} onChange={(e) => setPassword(e.target.value)} />
                <InputField Icon={LockKeyhole} type="password" placeholder="Confirm Password *" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-3 border-t pt-4">Your Role & Skills (Optional)</h3>
            
            {/* --- SOCIAL SERVICE FIELDS --- */}
            
            {/* 1. Location */}
            <InputField
              Icon={MapPin}
              type="text"
              placeholder="Your City or Region (for local matches)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
               // Made optional 
            />

            {/* 2. Cause Focus (Dropdown Select - MANDATORY) */}
            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Heart className="w-5 h-5" />
                </div>
                <select
                    value={causeFocus}
                    onChange={(e) => setCauseFocus(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-blue-50/50 focus:ring-green-500 focus:border-green-500 transition duration-150 shadow-sm text-gray-800 appearance-none"
                >
                    <option value="" disabled>Select Primary Cause Focus *</option>
                    {causeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                {/* Custom chevron icon for select box */}
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            
            {/* 3. Skills/Bio (Textarea for more detail) */}
            <div className="relative mb-6">
                <div className="absolute top-3 left-3 text-gray-400">
                    <ListChecks className="w-5 h-5" />
                </div>
                <textarea
                    placeholder="List your skills or areas of expertise (e.g., Event Planning, Tutoring, etc.)"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-blue-50/50 focus:ring-green-500 focus:border-green-500 transition duration-150 shadow-sm text-gray-800"
                    required={false} // Made optional
                />
            </div>
            
            {/* --- END SOCIAL SERVICE FIELDS --- */}


            {/* Terms Agreement Checkbox (CRITICAL) */}
            <div className="flex items-start mb-6 text-sm">
                <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    id="terms-agree"
                />
                <label htmlFor="terms-agree" className="ml-3 text-gray-600 select-none">
                    I agree to the <a href="#" className="text-green-600 hover:underline font-medium">Community Code of Conduct</a> and Terms of Service.
                </label>
            </div>


            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold text-white transition duration-300 ease-in-out transform shadow-lg ${
                loading || !isFormValid
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  <span>Join Community</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;

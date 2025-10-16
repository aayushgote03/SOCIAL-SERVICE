"use client"; // Mark this component as a Client Component

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem('user'); // Clear user data from localStorage
        signOut();
      }}
      className="block md:inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
    >
      LogOut
    </button>
  );
}
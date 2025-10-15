'use client'
import React from 'react'
import { useEffect, useState } from 'react';
import { use } from 'react';
import { getsession } from '@/actions/getsession';

const page = () => {

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await getsession();
                const data = await response.json();
                console.log("Session data fetched on client side:", data);
            }
            catch (error) {
                console.error("Error fetching session data:", error);
            }
        };  
        fetchSession();
    }, []);


  return (
    <div>page</div>
  )
}

export default page
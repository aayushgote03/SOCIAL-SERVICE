'use client';

import { useEffect } from "react";
import { fetchApplicationDetailsById } from "@/actions/get_application";

// 👇 server component
const Page = () => {
    useEffect(() => {
        async function fetchData() {
            const count = await fetchApplicationDetailsById("68f506023c27fe431df482c3")
            console.log("Redis Data:", count);
        }
        fetchData();
    }, [])
  

  return <p>efsefse</p>
}

export default Page
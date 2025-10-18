'use client'
import React, { useEffect } from 'react'
import { fetchTaskById } from '@/actions/get_task';
const page = () => {

    useEffect(()=>{
        async function gettask(id :string) {
            const task = await fetchTaskById(id);
            console.log(task, "vdfvf");
        }
        gettask('68f2a1610aedf28c50c583b8');
    });

  return (
    <div>

    </div>
  )
}

export default page
'use client'

import Image from 'next/image';
import Link from 'next/link';
import base_styles from '../../page.module.css';
import { redirect, useRouter } from 'next/navigation';

import Cookies from 'js-cookie';

export default function Home() {
  const Router = useRouter();
  
  if (Cookies.get("key") === undefined) {
    redirect('../login');
  }

 return (
    <main className={base_styles.main}>
      <div className={base_styles.center}>
        Nothing
      </div>
    </main>
  )
}

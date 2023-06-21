'use client'

import Image from 'next/image';
import Link from 'next/link';
import base_styles from '../page.module.css';
import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';

import Cookies from 'js-cookie';

export default function Home() {
  const Router = useRouter();

  const [username, setUsername] = useState<string>("");
  
  useEffect(() => {
    if (Cookies.get("key") === undefined) {
      redirect('../login');
    } else {
      setUsername(Cookies.get("username") || "");
    }
  }, []);

  function logout() {
    Cookies.remove("key");
    Cookies.remove("username");

    Router.replace("/");
  }

  return (
    <main className={base_styles.main}>
      <div className={base_styles.description}>
        <div>
          <Link
            href="https://www.school30.spb.ru/cgsg/"
            className={base_styles.card}
            target='_blank'
          >
            By FB1
            <Image
              src="/CGSG-Logo.svg"
              alt="CGSG logo"
              className={base_styles.vercelLogo}
              width={120}
              height={80}
              priority
            />
          </Link>
        </div>
      </div>
      <div className={styles.accountWindow}>
        <div className={styles.accountData}>
          <label>
            <p>Username</p>
            <span>
              {username}
            </span>
          </label>
          
          <div className={styles.logoutButton}>
            <button type="button" onClick={logout}>log out</button>
          </div>
        </div>
      </div>
    </main>
  )
}

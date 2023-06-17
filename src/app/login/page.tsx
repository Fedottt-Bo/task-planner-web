'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import base_styles from '../page.module.css';
import styles from './page.module.css';

import Signin from "./signin";
import Signup from './signup';

export default function Home() {
  const [loginMode, setLoginMode] = useState("signin");

  let content : JSX.Element;

  switch (loginMode) {
    case "signin":
      content = (
        <span>
          <Signin/>
          <div className={styles.mode_switch}>
            Don{"\'"}t have account? <button type="button" onClick={() => setLoginMode("signup")}>sign up</button>
          </div>
        </span>
      );
      break;
    case "signup":
      content = (
        <span>
          <Signup/>
          <div  className={styles.mode_switch}>
            Already have account? <button type="button" onClick={() => setLoginMode("signin")}>sign in</button>
          </div>
        </span>
      );
      break;
    default:
      content = <span>Error!</span>;
      break;
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

      <div className={base_styles.upperCenter}>
        <div className={styles.login_window}>
            {content}
        </div>
      </div>
    </main>
  )
}

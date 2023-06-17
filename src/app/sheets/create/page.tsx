'use client'

import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import base_styles from '../../page.module.css';

import SheetCreate from './sheet_create';

export default function Home() {
  if (Cookies.get("key") === undefined) {
    redirect('../login');
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
        <SheetCreate />
      </div>
    </main>
  )
}

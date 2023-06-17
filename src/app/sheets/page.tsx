'use client'

import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react'

import base_styles from '../page.module.css';
import styles from './page.module.css';

import {SheetCard, NewSheetCard} from './sheet_card'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [sheets, setSheets] = useState<Array<string>>([]);

  useEffect(() => {
    setIsLoading(true);
    if (Cookies.get("key") === undefined) {
      redirect('../login');
    }
    fetch('/api/sheets/list')
      .then(res => res.json())
      .then(data => {
        setSheets(data);
        setIsLoading(false);
      })
  }, [])

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
      {isLoading ? (
        <div className={base_styles.center}>
          Loading...
        </div>
      ) : (
        <div className={base_styles.grid}>
          {sheets.map((elm : string) => {
            const obj = {name : elm};
            return <SheetCard key={elm} {...obj}/>
          })}
          <NewSheetCard key="new-sheet-card"/>
        </div>
      )}
    </main>
  )
}

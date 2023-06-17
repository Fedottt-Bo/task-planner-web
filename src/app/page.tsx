import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <div>
          <Link
            href="https://www.school30.spb.ru/cgsg/"
            className={styles.card}
            target='_blank'
          >
            By FB1
            <Image
              src="/CGSG-Logo.svg"
              alt="CGSG logo"
              className={styles.vercelLogo}
              width={120}
              height={80}
              priority
            />
          </Link>
        </div>
      </div>

      <div className={styles.center}>
        <Image
          className={styles.logo}
          src="/CGSG-Logo.svg"
          alt="CGSG logo"
          width={360}
          height={240}
          priority
        />
      </div>

      <div className={styles.grid}>
        <Link
          href="account"
          className={styles.card}
        >
          <h2>
            Account <span>-&gt;</span>
          </h2>
          <p>View your account.</p>
        </Link>

        <Link
          href="sheets"
          className={styles.card}
        >
          <h2>
            Sheets <span>-&gt;</span>
          </h2>
          <p>View avalible sheets.</p>
        </Link>

        <Link
          href="sheets/create"
          className={styles.card}
        >
          <h2>
            New sheet <span>-&gt;</span>
          </h2>
          <p>Create new sheet.</p>
        </Link>
      </div>
    </main>
  )
}

import React from 'react';
import base_styles from '../page.module.css';
import styles from './page.module.css';
import Link from 'next/link';

type Props = {
  name : string,
  desc? : string
}

export function SheetCard(props : Props) {
  return (
    <Link
      href={'sheets/' + props.name}
      className={base_styles.card}
    >
      <h2>
        {props.name} <span>-&gt;</span>
      </h2>
      <p>{props.desc || ""}</p>
    </Link>
  )
}

export function NewSheetCard() {
  return (
    <Link
      href="sheets/create"
      className={base_styles.card}
    >
      <h2>
        Create <span>-&gt;</span>
      </h2>
      <p>create new sheet</p>
    </Link>
  )
}

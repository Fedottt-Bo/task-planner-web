'use client'

import React, { useContext } from 'react';

import { context } from './context';

export default function Card(props : {ind: number}) {
  const {sheetObj} = useContext(context);
  
  return (
    <div>
      <span>
        {sheetObj.cards[props.ind].label}
      </span>
      <span>
        {sheetObj.cards[props.ind].style}
      </span>
      {sheetObj.cards[props.ind].text}
    </div>
  )
}


'use client'

import React, { useContext } from 'react';

import { context } from './context';
import Card from './card';

export default function Column(props : {ind: number}) {
  const {sheetObj} = useContext(context);
  
  return (
    <div>
      <span>
        {sheetObj.columns[props.ind].label}
      </span>
      {sheetObj.columns[props.ind].cards.map(val => {
        return (
          <Card key={'card-' + val} ind={val}/>
        )
      })}
    </div>
  )
}

'use client'

import React, { useContext } from 'react';

import { context } from './context';
import Column from './column';

export default function Tab(props : {ind: string}) {
  const {sheetObj} = useContext(context);

  return (
    <div>
      {sheetObj.tables[props.ind].columns.map(val => {
        return (
          <Column key={'column-' + val} ind={val}/>
        )
      })}
    </div>
  )
}

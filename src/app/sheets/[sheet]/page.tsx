'use client'

import Cookies from 'js-cookie';
import { Socket, io } from 'socket.io-client';
import { redirect, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import base_styles from '../../page.module.css';

import { context, SheetType } from './context';
import Tab from './tab';

let socket : Socket;

export default function Home({ params }: { params: { sheet: string } }) {
  const Router = useRouter();

  const [isLoading, setIsLoading] = useState<Boolean>(true);
  const [sheet, setSheet] = useState<SheetType>({} as SheetType);
  const [tableInd, setTableInd] = useState<string>("");

  const setTable = useCallback((ind: any) => {
    setTableInd(Object.keys(sheet.tables)[ind]);
  }, [sheet.tables]);

  const moveCard = (column : number, new_column : number, ind : number, new_ind : number) => {
    /* Validate indices */
    if (ind >= sheet.columns[column].cards.length) return false;
    if (new_ind >= sheet.columns[new_column].cards.length - Number(column === new_column)) return false;

    /* Permute */
    const [removed] = sheet.columns[column].cards.splice(ind, 1);
    sheet.columns[new_column].cards.splice(new_ind, 0, removed);

    if (column === new_column) socket.emit('move card inside', column, ind, new_ind)
    else socket.emit('move card between', column, new_column, ind, new_ind)

    return true;
  }

  useEffect(() => {
    if (Cookies.get("key") === undefined) {
      redirect('../login');
    }
    
    /* Create socket */
    socket = io({
      reconnectionDelayMax: 10000,
      autoConnect: false,
      query: {
        path: params.sheet,
        username: Cookies.get('username')
      }
    })

    /* Setup all callbacks */
    socket
      .on('connection', () => { console.log('Conneected'); setIsLoading(true); })
      .on('sheet', (sheet) => { setSheet(sheet); setTableInd(Object.keys(sheet.tables)[0]); setIsLoading(false); })
      .on('move card inside', (column, ind, new_ind) => {})
      .on('move card between', (column, new_column, ind, new_ind) => {})

    /* Connect and store socket */
    socket.connect();
  }, [params.sheet])

  if (isLoading) {
    return (
      <main className={base_styles.main}>
        <div className={base_styles.center}>Loading...</div>
      </main> 
    )
  } else {
    return (
      <main className={base_styles.main}>
        <context.Provider value={{sheetName: params.sheet, sheetObj: sheet, socket: socket}}>
          <div className={base_styles.description}>
            {Object.keys(sheet.tables).map((val, ind) => (
              <div key={'table-header:' + val}>
                {ind + ': ' + val}
              </div>
            ))}
          </div>

          <div className={base_styles.upperCenter}>
            <Tab ind={tableInd}/>
          </div>
        </context.Provider>
      </main>
    )
  }
}

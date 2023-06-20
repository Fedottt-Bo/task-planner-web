'use client'

import Cookies from 'js-cookie';
import { randomBytes } from 'crypto';
import { Socket, io } from 'socket.io-client';
import { redirect, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';

import styles from './page.module.css';

import { context, SheetType } from './context';
import Column from './column';

export default function Home({ params }: { params: { sheet: string } }) {
  const Router = useRouter();

  const [isLoading, setIsLoading] = useState<Boolean>(true);
  const [sheet, setSheet] = useState<SheetType>({} as SheetType);
  const [socket, setSocket] = useState({} as Socket);

  const moveCard = useCallback((column: number, new_column: number, ind: number, new_ind: number, sendMessage: boolean = false) => {
    console.log(`moved card: from (${column}: ${ind}) to (${new_column}: ${new_ind})`);

    /* We don't do anything, but it is success */
    if (column === new_column && ind === new_ind) return true;

    /* Validate indices */
    if (ind >= sheet.table[column].cards.length) return false;
    if (new_ind > sheet.table[new_column].cards.length - Number(column === new_column)) return false;

    /* Permute */
    const new_sheet = {...sheet};
    new_sheet.table[new_column].cards.splice(new_ind, 0, ...new_sheet.table[column].cards.splice(ind, 1));

    if (sendMessage) {
      if (column === new_column) socket.emit('move card inside', column, ind, new_ind)
      else socket.emit('move card between', column, new_column, ind, new_ind)
    }

    setSheet(new_sheet);
    console.log('move success');

    return true;
  }, [socket, sheet])

  const moveColumn = useCallback((ind: number, new_ind: number, sendMessage: boolean = false) => {
    console.log(`moved column: from ${ind} to ${new_ind}`);

    /* We don't do anything, but it is success */
    if (ind === new_ind) return true;

    /* Validate indices */
    if (ind >= sheet.table.length || new_ind >= sheet.table.length) return false;

    /* Permute */
    const new_sheet = {...sheet};
    new_sheet.table.splice(ind, 0, ...new_sheet.table.splice(new_ind, 1));

    if (sendMessage) socket.emit('move column', ind, new_ind)

    setSheet(new_sheet);
    console.log('move success');

    return true;
  }, [socket, sheet]);

  const onDragEnd = useCallback((params : DropResult) => {
    switch (params.type) {
    case "CARDS":
      if (params.reason === 'DROP' && params.destination) {
        if (params.destination.droppableId === '-1') {
        } else {
          if (!moveCard(Number.parseInt(params.source.droppableId), Number.parseInt(params.destination.droppableId),
                        params.source.index, params.destination.index, true)) Router.refresh();
        }
      }
      break;
    case "COLUMN":
      if (params.reason === 'DROP' && params.destination) {
        if (!moveColumn(params.source.index, params.destination.index, true)) Router.refresh();
      }
      break;
    }
  }, [moveCard, moveColumn, Router])

  useEffect(() => {
    /* Validate access */
    if (Cookies.get("key") === undefined) {
      redirect('../login');
    }

    /* Create socket, set default callbacks and connect */
    setSocket(io({
      reconnectionDelayMax: 10000,
      autoConnect: false,
      query: {
        path: params.sheet,
        username: Cookies.get('username')
      }
    }).on('connection', () => {
      console.log('Conneected');
      setIsLoading(true);
    }).on('sheet', (sheet) => {
      setSheet(sheet);
      setIsLoading(false);
    }).connect())
  }, [params.sheet])

  /* Set sheet actions callbacks */
  useEffect(() => {
    if (!socket.connected) return;

    socket
      .removeAllListeners('move card inside').on('move card inside', (column, ind, new_ind) => {
        if (!moveCard(column, column, ind, new_ind)) Router.refresh()
      })
      .removeAllListeners('move card between').on('move card between', (column, new_column, ind, new_ind) => {
        if (!moveCard(column, new_column, ind, new_ind)) Router.refresh()
      })
      .removeAllListeners('move column').on('move column', (ind, new_ind) => {
        if (!moveColumn(ind, new_ind)) Router.refresh();
      })
  }, [socket, Router, moveCard, moveColumn]);

  const addCard = useCallback((column: number, card: {}) => {

  }, [sheet])

  if (isLoading) {
    return (
      <main className={styles.sheet}>
        <div className={styles.description}>Loading...</div>
      </main> 
    )
  } else {
    return (
      <main className={styles.sheet}>
        <context.Provider value={{sheetName: params.sheet, sheetObj: sheet, addCard}}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
              droppableId="table"
              type="COLUMN"
              direction="horizontal"
            >
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={styles.tab}
                >
                  {sheet.table.map((val, ind) => {
                    return (
                      <Column key={'column-' + (val.id ? val.id : (val.id = randomBytes(4).readUInt32BE()))} ind={ind}/>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </context.Provider>
      </main>
    )
  }
}

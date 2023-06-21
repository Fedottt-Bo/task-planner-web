'use client'

import Cookies from 'js-cookie';
import { randomBytes } from 'crypto';
import { Socket, io } from 'socket.io-client';
import { redirect, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';
import { Popup } from 'reactjs-popup';

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
    new_sheet.table.splice(new_ind, 0, ...new_sheet.table.splice(ind, 1));

    if (sendMessage) socket.emit('move column', ind, new_ind)

    setSheet(new_sheet);
    console.log('move success');

    return true;
  }, [socket, sheet]);

  const addCard = useCallback((column: number, card: {label: string, style: string, text: string}, sendMessage: boolean = true) => {
    /* Validate */
    if (sheet.table[column] === undefined) return false;
    if (sheet.styles[card.style] === undefined) return false;

    /* Add */
    const new_sheet = {...sheet};
    new_sheet.table[column].cards.push(card);

    setSheet(new_sheet);

    if (sendMessage) socket.emit('add card', column, card.label, card.style, card.text);

    return true;
  }, [sheet, socket])

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
      .removeAllListeners('add card').on('add card', (column, label, style, text) => {
        if (!addCard(column, {label, style, text}, false)) Router.refresh();
      })
  }, [socket, Router, moveCard, moveColumn, addCard]);

  const StylesManage = () => {
    return (
      <Popup
        trigger={<button className={styles.element}>Manage styles</button>}
        modal
        nested
      >
        <div>Yeah</div>
      </Popup>
    )
  }

  const ColumnAdding = () => {
    return (
      <Popup
        trigger={<button className={styles.element}>Add column</button>}
        modal
        nested
      >
        <div>Yeah</div>
      </Popup>
    )
  }

  const AccessManage = () => {
    return (
      <Popup
        trigger={<button className={styles.element}>Manage access</button>}
        {...{
          overlayStyle: {
            background: `radial-gradient(ellipse at top, rgba(200, 200, 255, 0.13) 0%, transparent 75%), radial-gradient(ellipse at bottom, rgba(130, 200, 130, 0.18) 0%, transparent 75%)`,
            animation: "cardAddPopupOpenAnim 300ms cubic-bezier(0.38, 0.1, 0.36, 0.9) forwards"
          }
        }}
        modal
        nested
      >
        <div>
          
        </div>
      </Popup>
    )
  }
  
  if (isLoading) {
    return (
      <main className={styles.sheet}>
        <div className={styles.description}>Loading...</div>
      </main> 
    )
  } else {
    return (
      <main className={styles.sheet}>
        <div className={styles.description}>
          <StylesManage/>
          <ColumnAdding/>
          <AccessManage/>
        </div>
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

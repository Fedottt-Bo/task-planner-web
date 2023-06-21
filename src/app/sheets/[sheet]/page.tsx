'use client'

import Cookies from 'js-cookie';
import { randomBytes } from 'crypto';
import { Socket, io } from 'socket.io-client';
import { redirect, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DragStart, DropResult, Droppable, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { Popup } from 'reactjs-popup';

import styles from './page.module.css';

import { context, SheetType } from './context';
import Column from './column';
import classNames from 'classnames';

export default function Home({ params }: { params: { sheet: string } }) {
  const Router = useRouter();

  const [isLoading, setIsLoading] = useState<Boolean>(true);
  const [sheet, setSheet] = useState<SheetType>({} as SheetType);
  const [socket, setSocket] = useState({} as Socket);

  const [isDragging, setIsDragging] = useState(false);

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

  const addUser = useCallback((username: string, sendMessage: boolean = false) => {
    const act = () => {
      if (sheet.users.findIndex(val => val === username) === -1) {
        const new_sheet = {...sheet};
        new_sheet.users.push(username);
        setSheet(new_sheet);
      }
    }

    console.log(`Adding user: ${username}`);

    if (sendMessage) socket.emit('add user', username, (success?: boolean) => {
      if (success) act()
      else alert(`Failed adding ${username}`);
    })
    else act()

    return true;
  }, [sheet, socket])

  const removeUser = useCallback((username: string, sendMessage: boolean = false) => {
    const act = () => {
      if (username === Cookies.get('username')) {
        Router.replace('/sheets');
      } else {
        let ind = sheet.users.findIndex(val => val === username);

        if (ind !== -1) {
          const new_sheet = {...sheet};
          new_sheet.users.splice(ind, 1);
          setSheet(new_sheet);
        }
      }
    }

    console.log(`Removing user: ${username}`);
    
    if (sendMessage) socket.emit('remove user', username, (success?: boolean) => {
      if (success) act()
      else alert(`Failed removing ${username}`);
    })
    else act();

    return true;
  }, [sheet, socket, Router])

  const addEditStyle = useCallback((name: string, obj: any, sendMessage: boolean = false) => {
    const new_sheet = {...sheet};
    new_sheet.styles[name] = obj;
    setSheet(new_sheet);

    if (sendMessage) socket.emit('add style', name, obj);
    
    return true;
  }, [sheet, socket])


  const deleteCard = useCallback((column: number, ind: number, sendMessage: boolean = false) => {
    console.log(`deleting card: (${column}: ${ind})`)

    /* Validate indices */
    if (sheet.table[column] === undefined || sheet.table[column].cards[ind] === undefined) return false;

    const new_sheet = {...sheet};
    new_sheet.table[column].cards.splice(ind, 1);
    setSheet(new_sheet);

    if (sendMessage) socket.emit('delete card', column, ind);

    return true;
  }, [sheet, socket])

  const onDragStart = useCallback((event: DragStart) => {
    setIsDragging(event.type === "CARDS");
  }, []);

  const onDragEnd = useCallback((params : DropResult) => {
    setIsDragging(false);

    switch (params.type) {
    case "CARDS":
      if (params.reason === 'DROP' && params.destination) {
        if (params.destination.droppableId === '-1') {
          if (!deleteCard(Number.parseInt(params.source.droppableId), params.source.index, true)) Router.refresh();
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
  }, [moveCard, moveColumn, deleteCard, Router])

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
      .removeAllListeners('add user').on('add user', (username) => {
        addUser(username, false);
      })
      .removeAllListeners('remove user').on('remove user', (username) => {
        removeUser(username, false);
      })
      .removeAllListeners('delete card').on('delete card', (column, ind) => {
        deleteCard(column, ind, false);
      })
  }, [socket, Router, moveCard, moveColumn, addCard, addUser, removeUser, deleteCard]);

  const StylesManage = () => {
    return (
      <Popup
        trigger={<button className={styles.element}>Manage styles</button>}
        {...{
          overlayStyle: {
            background: `radial-gradient(ellipse at top, rgba(200, 200, 255, 0.13) 0%, transparent 75%), radial-gradient(ellipse at bottom, rgba(130, 200, 130, 0.18) 0%, transparent 75%)`,
            animation: "cardAddPopupOpenAnim 300ms cubic-bezier(0.38, 0.1, 0.36, 0.9) forwards"
          }
        }}
        modal
        nested
      >
        <div style={{backgroundColor: "transparent", width: "max-content", height: "max-content"}}>
          {Object.entries(sheet.styles).map(val => {
            return (
              <div key={val[0]} className={styles.card}>
                <div className={styles.label} style={{color: val[1].labelColor, backgroundColor: val[1].bgColor}}>{val[0]}</div>
                <p className={styles.text} style={{color: val[1].textColor, backgroundColor: val[1].bgColor}}>Text example</p>
              </div>
            )
          })}
        </div>
      </Popup>
    )
  }

  const ColumnAdding = () => {
    return (
      <Popup
        trigger={<button className={styles.element}>Add column</button>}
        {...{
          overlayStyle: {
            background: `radial-gradient(ellipse at top, rgba(200, 200, 255, 0.13) 0%, transparent 75%), radial-gradient(ellipse at bottom, rgba(130, 200, 130, 0.18) 0%, transparent 75%)`,
            animation: "cardAddPopupOpenAnim 300ms cubic-bezier(0.38, 0.1, 0.36, 0.9) forwards"
          }
        }}
        modal
        nested
      >
        <div style={{color: "red"}}>Not implemented yet</div>
      </Popup>
    )
  }

  const AccessManage = () => {
    const [username, setUsername] = useState<string>("");

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
          {sheet.users.map((val, ind) => {
            return (
              <div key={'user-' + ind} className={styles.card}>
                <label className={styles.label}>{val}</label>
                <button onClick={e => {
                  removeUser(val, true);
                }} style={{margin: "0.5rem"}}>remove</button>
              </div>
            )
          })}
          <form className={styles.card}>
            <input placeholder='username' onChange={(e: React.ChangeEvent) => setUsername((e.target as HTMLTextAreaElement).value)}></input>
            <button onClick={e => {
              e.preventDefault();
              addUser(username, true);
            }}>add user</button>
          </form>
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
        <div className={classNames(
          styles.description,
          isDragging ? styles.descriptionClose : styles.descriptionOpen
        )}>
          <StylesManage/>
          <ColumnAdding/>
          <AccessManage/>
        </div>
        <context.Provider value={{sheetName: params.sheet, sheetObj: sheet, addCard, deleteCard}}>
          <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
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
                  <div className={styles.columns}>
                    {sheet.table.map((val, ind) => {
                      return (
                        <Column key={'column-' + (val.id ? val.id : (val.id = randomBytes(4).readUInt32BE()))} ind={ind}/>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                  <Droppable
                    droppableId="-1"
                    type="CARDS"
                  >
                    {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{
                          height: "18vmin",
                          width: "30vmin"
                        }}
                        className={classNames(
                          styles.deleteCard,
                          isDragging ? styles.descriptionOpen : styles.descriptionClose,
                          snapshot.isDraggingOver ? styles.deleteCardActive : styles.deleteCardUnactive
                        )}
                      >
                        {snapshot.isDraggingOver ? <></> : <span>delete card</span>}
                      </div>
                    )}
                  </Droppable>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </context.Provider>
      </main>
    )
  }
}

'use client'

import React, { useContext, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Popup } from 'reactjs-popup';

import styles from './page.module.css';

import { RichEditor, SimpleEditor } from './text_editor';
import { context } from './context';

export function Card(props : {ind: number, column: number}) {
  const {sheetObj} = useContext(context);

  const card = sheetObj.table[props.column].cards[props.ind];

  return (
    <Draggable draggableId={'card-' + card.id} index={props.ind}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={styles.card}
        >
          <div className={styles.label}>{card.label}</div>
          <span>
            {card.style}
          </span>
          <div>
            {card.text}
          </div>
        </div>
      )}
    </Draggable>
  )
}


export function AddCard(props: {ind: number}) {
  const {sheetObj} = useContext(context);

  const labelEditor = useRef<any>(null);
  const textEditor = useRef<any>(null);

  return (
    <div className={styles.card}>
        
    <Popup
      trigger={<button className={styles.cardAdd}>Add new card</button>}
      {...{
        overlayStyle: {
          background: `radial-gradient(rgba(47, 47, 47, 0.47) 18%, rgba(102, 102, 102, 0.666) 30%, rgba(255, 255, 255, 0.30))`,
          animation: "cardAddPopupOpenAnim 300ms cubic-bezier(0.38, 0.1, 0.36, 0.9) forwards"
        }
      }}
      modal
      nested
    >
      <div>
        <SimpleEditor ref={labelEditor}/>
        <SimpleEditor ref={textEditor}/>
        <button onClick={() => {if (textEditor.current) console.log(textEditor.current.state.editorState.getCurrentContent().getPlainText('\u0001'))}}>aaaaaaaaa</button>
      </div>
    </Popup>
      </div>
  )
}

'use client'

import React, { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Draggable } from 'react-beautiful-dnd';
import { Popup } from 'reactjs-popup';
import { DropdownList } from 'react-widgets';
import HTMLReactParser from 'html-react-parser'

import "react-widgets/styles.css";
import styles from './page.module.css';
import text_styles from './text_editor.css';

import { useTextEditor, TextEditor, useRichEditor, RichEditor } from './text_editor';
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
          <div className={text_styles.formattedText}>
            {HTMLReactParser(card.text)}
          </div>
        </div>
      )}
    </Draggable>
  )
}


export function AddCard(props: {ind: number}) {
  const {sheetObj, addCard} = useContext(context);
  const Router = useRouter();

  const labelEditor = useTextEditor({placeholder: ""});
  const textEditor = useRichEditor({placeholder: ""});
  const [style, setStyle] = useState<string>(Object.keys(sheetObj.styles)[0]);

  function onClick() {
    const label = labelEditor?.getText();
    const text = textEditor?.getHTML();

    if (label && text && !addCard(props.ind, {label, style, text})) Router.refresh();
  }

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
      <div className={styles.cardAddPopup}>
        <div className={styles.inputField}>
          <span>Add card to column &apos;{sheetObj.table[props.ind].label}&apos;</span>
        </div>
        <div className={styles.inputField}>
          <label>Card label:</label>
          <TextEditor editor={labelEditor}/>
        </div>
        <div
          className={styles.inputField}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          <label style={{display: "flexbox", verticalAlign: "center", height: "max-content"}}>Style:</label>
          <DropdownList
            data={Object.entries(sheetObj.styles).map(val => {return {name: val[0]}})}
            dataKey="name"
            textField="name"
            defaultValue={style}
            defaultOpen={false}
            onChange={(obj: {name: string}) => setStyle(obj.name)}
            style={{display: "flexbox"}}
          />
        </div>
        <div className={styles.inputField}>
          <label>Card text:</label>
          <RichEditor editor={textEditor}/>
        </div>
        <button onClick={onClick}>Confirm</button>
      </div>
    </Popup>
      </div>
  )
}

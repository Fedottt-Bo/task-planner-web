'use client'

import React, { useContext, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Draggable } from 'react-beautiful-dnd';
import { Popup } from 'reactjs-popup';
import { DropdownList } from 'react-widgets';

import "react-widgets/styles.css";
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
  const {sheetObj, addCard} = useContext(context);
  const Router = useRouter();

  const labelEditor = useRef<any>(null);
  const textEditor = useRef<any>(null);
  const [style, setStyle] = useState<string>("");

  function onClick() {
    const label = labelEditor.current.state.editorState.getCurrentContent().getPlainText('\u0001');
    const text = textEditor.current.state.editorState.getCurrentContent().getPlainText('\u0001');

    if (!addCard(props.ind, {label, style, text})) Router.refresh();
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
      <div>
        <span>Add card to column №{props.ind}</span>
        <SimpleEditor placeholder="label" ref={labelEditor}/>
        <DropdownList
          data={Object.entries(sheetObj.styles).map(val => {return {name: val[0]}})}
          dataKey="name"
          textField="name"
          defaultValue={Object.keys(sheetObj.styles)[0]}
          defaultOpen={false}
          onChange={(obj: {name: string}) => setStyle(obj.name)}
        />
        <SimpleEditor placeholder="text" ref={textEditor}/>
        <button onClick={onClick}>Confirm</button>
      </div>
    </Popup>
      </div>
  )
}

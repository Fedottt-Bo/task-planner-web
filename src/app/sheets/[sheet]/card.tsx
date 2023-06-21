'use client'

import React, { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { Popup } from 'reactjs-popup';
import { DropdownList } from 'react-widgets';
import HTMLReactParser from 'html-react-parser'
import classNames from 'classnames';

import "react-widgets/styles.css";
import styles from './page.module.css';
import text_styles from './text_editor.css';

import { useTextEditor, TextEditor, useRichEditor, RichEditor } from './text_editor';
import { context } from './context';

export function Card(props : {ind: number, column: number}) {
  const {sheetObj} = useContext(context);

  const card = sheetObj.table[props.column].cards[props.ind];
  const style = sheetObj.styles[card.style];

  const getStyle = (style: any, snapshot: DraggableStateSnapshot) => {
    if (!snapshot.isDropAnimating) {
      return style;
    }

    if (snapshot.isDropAnimating && snapshot.draggingOver === "-1") {
      return {
        ...style,
        opacity: "0",
        transition: `all 1ms linear`
      }
    }

    return {
      ...style,
      transition: `all 1s ease`,
      transitionDelay: "80ms",
    };
  }

  return (
    <Draggable draggableId={'card-' + card.id} index={props.ind}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={classNames(
            styles.card,
            (snapshot.isDragging && !snapshot.isDropAnimating) && styles.draggingAnimation
          )}
          style={getStyle(provided.draggableProps.style, snapshot)}
        >
          <div className={styles.label} style={{color: style.labelColor, backgroundColor: style.bgColor}}>{card.label}</div>
          <div className={styles.text} style={{color: style.textColor, backgroundColor: style.bgColor}}>
            <div className={text_styles.ProseMirror}>
              {HTMLReactParser(card.text)}
            </div>
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
  const [style, setStyle] = useState<string>("default");

  const [isOpen, setIsOpen] = useState(false);

  function onClick() {
    const label = labelEditor?.getText();
    const text = textEditor?.getHTML();

    if (label && text) {
      if (addCard(props.ind, {label, style, text})) {
        labelEditor?.commands.clearContent();
        textEditor?.commands.clearContent();
        setStyle("default");
        setIsOpen(false);
      } else {
        Router.refresh();
      }
    }
  }

  return (
    <Popup
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      trigger={
        <div
          className={styles.card}
          style={{
            padding: "0",
            display: "flex",
            flexFlow: "column nowarp",
            alignContent: "center",
            height: "fit-content",
          }}
        >
          <button
            style={{
              width: "100%",
              border: "none"
            }}
          >
            Add new card
          </button>
        </div>
      }
      {...{
        overlayStyle: {
          background: `radial-gradient(ellipse at top, rgba(200, 200, 255, 0.13) 0%, transparent 75%), radial-gradient(ellipse at bottom, rgba(200, 130, 130, 0.18) 0%, transparent 75%)`,
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
        <button onClick={e => {e.preventDefault(); onClick()}}>Confirm</button>
      </div>
    </Popup>
  )
}

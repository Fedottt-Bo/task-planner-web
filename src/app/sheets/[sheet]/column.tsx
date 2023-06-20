'use client'

import React, { useContext } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';

import { context } from './context';
import { Card, AddCard } from './card';

import styles from './page.module.css';

export default function Column(props : {ind: number, column_ind: number}) {
  const {sheetObj} = useContext(context);
  
  return (
    <Draggable
      draggableId={props.column_ind.toString()}
      index={props.ind}
    >
      {(provided) => (
        <div
          className={styles.column}
          {...provided.dragHandleProps}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div className={styles.label}>
            {sheetObj.columns[props.column_ind].label}
          </div>
          <Droppable
            droppableId={props.column_ind.toString()}
            type='CARDS'
          >
            {(provided, snapshot) => (          
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={styles.cards}
              >
                {sheetObj.columns[props.column_ind].cards.map((val, ind) => (
                  <Card key={'card-' + val} ind={ind} card_ind={val}/>
                ))}
                {provided.placeholder}
                <AddCard {...props}/>
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  )
}

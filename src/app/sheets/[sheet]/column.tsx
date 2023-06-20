'use client'

import { randomBytes } from 'crypto';
import React, { useContext } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';

import { context } from './context';
import { Card, AddCard } from './card';

import styles from './page.module.css';

export default function Column(props : {ind: number}) {
  const {sheetObj} = useContext(context);

  const column = sheetObj.table[props.ind];
  
  return (
    <Draggable
      draggableId={'column-' + column.id}
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
            {sheetObj.table[props.ind].label}
          </div>
          <Droppable
            droppableId={props.ind.toString()}
            type='CARDS'
          >
            {(provided, snapshot) => (          
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={styles.cards}
              >
                {column.cards.map((val, ind, arr) => (
                  <Card key={'card-' + (val.id ? val.id : (arr[ind].id = randomBytes(4).readUInt32BE(0)))} ind={ind} column={props.ind}/>
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

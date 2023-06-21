'use client'

import { randomBytes } from 'crypto';
import React, { useContext } from 'react';
import { Draggable, DraggableProvided, DraggableStateSnapshot, Droppable, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';

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
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          {...provided.dragHandleProps}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div
            className={styles.column}
            style={{backgroundColor: !snapshot.isDragging ? "inherit" : "rgba(102, 240, 102, 0.30)"}}
          >
            <div className={styles.label}>
              {sheetObj.table[props.ind].label}
            </div>
            <Droppable
              droppableId={props.ind.toString()}
              type='CARDS'
            >
              {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (          
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <div
                    className={styles.cards}
                    style={{backgroundColor: !snapshot.isDraggingOver ? "inherit" : "rgba(240, 240, 102, 0.30)"}}
                  >
                    {column.cards.map((val, ind, arr) => (
                      <Card key={'card-' + (val.id ? val.id : (arr[ind].id = randomBytes(4).readUInt32BE(0)))} ind={ind} column={props.ind}/>
                      ))}
                    {provided.placeholder}
                    <AddCard {...props}/>
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </div>
      )}
    </Draggable>
  )
}

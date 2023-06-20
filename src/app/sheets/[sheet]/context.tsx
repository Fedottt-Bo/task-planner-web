import { createContext }  from 'react';
import { Socket, io } from 'socket.io-client';

export type SheetType = {
  name: string,
  styles: {[index: string]: {bgColor: string, labelColor: string, textColor: string}}
  cards: {label: string, style: string, text: string}[]
  columns: {label: string, cards: Array<number>}[]
  table: Array<number>
}

export type ContextType = {
  sheetName: string
  sheetObj: SheetType
  addCard: (column: number, card: {}) => void
}

export const context = createContext({} as ContextType);

import { createContext }  from 'react';
import { Socket, io } from 'socket.io-client';

export type SheetType = {
  name: string,
  styles: {[index: string]: {bgColor: string, labelColor: string, textColor: string}}
  table: Array<{label: string, cards: Array<{label: string, style: string, text: string, id?: number}>, id?: number}>
  users: Array<string>
}

export type ContextType = {
  sheetName: string
  sheetObj: SheetType
  addCard: (column: number, card: {label: string, style: string, text: string}, sendMessage?: boolean) => boolean
  deleteCard: (column: number, ind: number, sendMessage?: boolean) => boolean
}

export const context = createContext({} as ContextType);

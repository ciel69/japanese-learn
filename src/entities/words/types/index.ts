// src/types/index.ts

export type Kanji = {
  char: string
  meaning: string
  kun: string // кун-чтение
  on: string // он-чтение
  strokesCount: number
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
}

export type Word = {
  word: string
  kana: string // хирагана/катакана
  romaji?: string // ромадзи (необязательное)
  meaning: string
  category: string
  kanji?: string[] // какие иероглифы входят в слово
}

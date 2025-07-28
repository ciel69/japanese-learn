export type KanaSymbol = {
  hiragana: string
  romaji: string
  group: string
  order: number
}

// Прогресс — как в бэкенде
export type Progress = {
  entityId: number // ID символа
  progress: number // 0–100
  updatedAt: string
}

declare global {
  interface Window {
    responsiveVoice: {
      speak: (text: string, voice?: string, params?: never) => void
      // ... другие методы
    }
  }
}

export const useResponsiveVoice = () => {
  return {
    speak: (text: string) => {
      try {
        window.responsiveVoice?.speak(text, 'Japanese Female')
      } catch (error) {
        console.error('Ошибка синтеза речи:', error)
      }
    },
  }
}

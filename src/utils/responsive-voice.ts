declare global {
  interface Window {
    /**
     * Типизация сторонней библиотеки responsivevoice.js (https://responsivevoice.org/api/)
     */
    responsiveVoice: {
      speak: (text: string, voice?: string, params?: never) => void
      // ... другие методы
    }
  }
}

export const useResponsiveVoice = () => {
  const responsiveVoice = (text: string) => {
    try {
      window.responsiveVoice?.speak(text, 'Japanese Female')
    } catch (error) {
      console.error('Ошибка синтеза речи:', error)
    }
  }

  const speak = (text: string) => {
    // Если нет нативной поддержки, вызываем функционал библиотеки
    if (!window.speechSynthesis) {
      responsiveVoice(text)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    speechSynthesis.speak(utterance)
  }

  return {
    speak,
  }
}

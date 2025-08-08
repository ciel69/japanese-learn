import axios from 'axios'

const BASE_URL = 'https://api.kanji-flow.ru'

export const useResponsiveVoice = () => {
  const generateVoice = async (text: string, speaker: number = 44) => {
    try {
      const response = await axios.get(`${BASE_URL}/tts/generate`, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // или конкретный домен
          'tuna-skip-browser-warning': 'test-api',
        },
        params: {
          text,
          speaker, // 44 неплох для каны
          pitch: 0.01, // 44 неплох для каны
          volume: 5,
          speed: 1.1,
        },
        responseType: 'arraybuffer', // Получаем как ArrayBuffer
      })

      const audioContext = new AudioContext()
      const buffer = await audioContext.decodeAudioData(response.data)

      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start()
    } catch (error) {
      console.error('Ошибка генерации голоса:', error)
      return new Error()
    }
  }

  const speak = async (text: string, speaker = 44) => {
    try {
      await generateVoice(text, speaker)
    } catch (e: any) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ja-JP'
      utterance.rate = 1.0
      utterance.pitch = 1.0

      speechSynthesis.speak(utterance)
    }
  }

  return {
    speak,
  }
}

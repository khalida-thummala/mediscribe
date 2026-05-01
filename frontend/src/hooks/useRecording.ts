import { useRef, useCallback, useEffect, useState } from 'react'
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'
import { useConsultationStore } from '@/store/consultationStore'

export function useRecording() {
  const { isRecording, startRecording, stopRecording, tick, appendTranscript } = useConsultationStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  const [audioBase64, setAudioBase64] = useState<string | null>(null)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Start MediaRecorder
      audioChunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder

      // Start Azure Speech
      const speechKey = (import.meta as any).env.VITE_AZURE_SPEECH_KEY
      const speechRegion = (import.meta as any).env.VITE_AZURE_SPEECH_REGION

      if (speechKey && speechRegion) {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion)
        speechConfig.speechRecognitionLanguage = 'en-US'
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
        
        const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig)
        
        recognizer.recognized = (_, e) => {
          if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            appendTranscript(e.result.text)
          }
        }
        
        recognizer.startContinuousRecognitionAsync()
        recognizerRef.current = recognizer
      } else {
        console.warn('Azure Speech credentials not provided.')
      }

      startRecording()
      timerRef.current = setInterval(tick, 1000)
    } catch (err) {
      console.error('Error starting recording:', err)
    }
  }, [appendTranscript, startRecording, tick])

  const stop = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      stopRecording()
      if (timerRef.current) clearInterval(timerRef.current)

      if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync(() => {
          recognizerRef.current?.close()
          recognizerRef.current = null
        })
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const reader = new FileReader()
          reader.readAsDataURL(audioBlob)
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1]
            setAudioBase64(base64String)
            resolve(base64String)
          }
        }
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      } else {
        resolve('')
      }
    })
  }, [stopRecording])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognizerRef.current) recognizerRef.current.close()
      if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop()
    }
  }, [])

  return { isRecording, start, stop, audioBase64 }
}

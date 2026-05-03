import { useRef, useCallback, useEffect, useState } from 'react'
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'
import { useConsultationStore } from '@/store/consultationStore'

export function useRecording() {
  const { isRecording, startRecording, stopRecording, tick, appendTranscript } = useConsultationStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  
  const [audioBase64, setAudioBase64] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      // Setup Web Audio API for Visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      const analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyserNode
      setAnalyser(analyserNode)

      // Start MediaRecorder
      audioChunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorder.start(1000) // Collect chunks every second
      mediaRecorderRef.current = mediaRecorder

      // Start Azure Speech
      const speechKey = (import.meta as any).env.VITE_AZURE_SPEECH_KEY
      const speechRegion = (import.meta as any).env.VITE_AZURE_SPEECH_REGION

      if (speechKey && speechRegion) {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion)
        speechConfig.speechRecognitionLanguage = 'en-US'
        // Set service property for Medical domain as per architecture
        speechConfig.setServiceProperty("punctuation", "true", SpeechSDK.ServicePropertyChannel.UriQueryParameter)
        
        const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(SpeechSDK.AudioInputStream.createPushStream())
        // Note: For simplicity in the browser, we often use fromDefaultMicrophoneInput
        // but the SDK handles the stream internally.
        const internalAudioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
        
        const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, internalAudioConfig)
        
        recognizer.recognized = (_, e) => {
          if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            appendTranscript(e.result.text)
          }
        }
        
        recognizer.startContinuousRecognitionAsync()
        recognizerRef.current = recognizer
      } else {
        console.warn('Azure Speech credentials not provided. Live transcription disabled.')
      }

      startRecording()
      timerRef.current = setInterval(tick, 1000)
    } catch (err) {
      console.error('Error starting recording:', err)
      toast.error('Could not access microphone')
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

      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
        setAnalyser(null)
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
      if (audioContextRef.current) audioContextRef.current.close()
      if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop()
    }
  }, [])

  return { isRecording, start, stop, audioBase64, analyser }
}

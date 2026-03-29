import { useState, useRef, useCallback } from 'react'

const REC_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PREVIEW: 'preview',
}

export { REC_STATUS }

export default function useVideoRecorder() {
  const [recStatus, setRecStatus] = useState(REC_STATUS.IDLE)
  const [videoBlob, setVideoBlob] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)

  const videoPreviewRef = useRef(null)
  const videoPlaybackRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream
      return true
    } catch {
      return false
    }
  }, [])

  const stopStreamAndReset = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null
    if (videoUrl) URL.revokeObjectURL(videoUrl)
  }, [videoUrl])

  const resetRecordingState = useCallback(() => {
    setRecStatus(REC_STATUS.IDLE)
    setVideoBlob(null)
    setVideoUrl(null)
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    chunksRef.current = []
    mediaRecorderRef.current = new MediaRecorder(streamRef.current)
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setVideoBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
      setRecStatus(REC_STATUS.PREVIEW)
    }
    mediaRecorderRef.current.start()
    setRecStatus(REC_STATUS.RECORDING)
  }, [])

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null
  }, [])

  const reRecord = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoBlob(null)
    setVideoUrl(null)
    setRecStatus(REC_STATUS.IDLE)
  }, [videoUrl])

  return {
    recStatus, videoBlob, videoUrl,
    videoPreviewRef, videoPlaybackRef,
    startCamera, startRecording, stopRecording, reRecord,
    stopStreamAndReset, resetRecordingState,
  }
}

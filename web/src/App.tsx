import { useEffect, useRef, useState } from "react"
import reactLogo from "./assets/react.svg"
import "./App.css"

const useMediaStream = () => {
	const mediaStreamRef = useRef<MediaStream>()
	useEffect(() => {
		;(async () => {
			const media = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: false,
			})
			mediaStreamRef.current = media
		})()
	}, [])

	return {
		start: (
			opts:
				| {
						onDataAvailable?: (blob: Blob) => void
				  }
				| undefined
		) => {
			const { onDataAvailable } = opts ?? {}
			const mediaStream = mediaStreamRef.current
			if (!mediaStream) throw new Error("MediaStream unavailable")
			const recorder = new MediaRecorder(mediaStream, {
				mimeType: "audio/webm;codecs=opus",
				audioBitsPerSecond: 24000,
			})
			recorder.addEventListener("dataavailable", (blobEvent) => {
				const blob = blobEvent.data
				onDataAvailable?.(blob)
			})
			recorder.start(100)
			console.log("start recording...")
			return () => recorder.stop()
		},
	}
}

function App() {
	const [speechHistory, setSpeechHistory] = useState<
		{
			transcript: string
			timestamp: Date
		}[]
	>([])
	const { start } = useMediaStream()

	return (
		<div className="App">
			<h1>Real Time STT</h1>
			<button
				onClick={() => {
					let stop: () => void
					const ws = new WebSocket("ws://localhost:3000")
					ws.addEventListener("open", (e) => {
						console.log("WebSocket Open", e)
						stop = start({
							onDataAvailable: (blob) => {
								ws.send(blob)
							},
						})
					})
					ws.addEventListener("close", (e) => {
						console.log("WebSocket Close", e)
						stop?.()
					})
					ws.addEventListener("message", (e) => {
						setSpeechHistory((s) => [
							{
								transcript: e.data,
								timestamp: new Date(),
							},
							...s,
						])
					})
				}}>
				Start
			</button>
			<div className="card">
				{speechHistory.map(({ timestamp, transcript }) => (
					<div key={timestamp.getTime()} className="speech">
						<div className="timestamp">{timestamp.toISOString()}</div>
						<div className="transcript">{transcript}</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default App

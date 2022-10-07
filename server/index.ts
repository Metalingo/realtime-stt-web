import speech from "@google-cloud/speech"
import express from "express"
import http from "http"
import { Server as WSServer } from "ws"

const client = new speech.SpeechClient()
const app = express()
const server = http.createServer(app).listen(3000, () => {
	console.log("Listening...")
})
const wss = new WSServer({
	server,
})

wss.on("connection", (stream) => {
	console.log(`New Client Connection`)
	// Create a recognize stream
	const recognizeStream = client
		.streamingRecognize({
			config: {
				sampleRateHertz: 24000,
				encoding: "WEBM_OPUS",
				languageCode: "en-US",
			},
			// interimResults: true,
			singleUtterance: false,
		})
		.on("error", console.error)
		.on("data", (data) => {
			stream.send(data.results?.[0]?.alternatives?.[0]?.transcript ?? "")
		})
	stream.on("message", (data, isBinary) => {
		recognizeStream.write(data)
	})
	stream.on("close", () => {
		console.log("Connection Closed")
	})
})

const express = require('express')
const path = require("path")
const { createCanvas, loadImage } = require('canvas')
const audioLoader = require('audio-loader')
const http = require('http')
const socketIO = require('socket.io')

const images = {}

// Draw cat with lime helmet
loadImage(path.join(__dirname, "the_image.png")).then((image) => {
    images.the_image = image
})

const background = audioLoader(path.join(__dirname, "eclaircie.mp3")).then(it => {
    delete it._data
    it.id = "background"
    return it
})
background.catch(err => {
    console.error(err)
})
// draw some text and a line
const canvas = createCanvas(200, 200)
const ctx = canvas.getContext('2d') 

const app = express();
app.use(express.static(path.join(__dirname, "public")))
const server = http.createServer(app);
const io = socketIO(server);
io.on('connection', client => {
    const state = {
        last_update: Date.now(),
        rotation: 0
    }
    const video = setInterval(() => {
        const now = Date.now()
        const diff = (now - state.last_update) / 1000
        state.last_update = now
        state.rotation += (Math.PI / 180) * diff
        ctx.save()
        ctx.clearRect(0, 0, 200, 200)
        ctx.drawImage(images.the_image, 0, 0)
        ctx.font = '30px Impact'
        ctx.rotate(state.rotation)
        ctx.fillText('Awesome!', 50, 100)
        const text = ctx.measureText('Awesome!')
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'
        ctx.beginPath()
        ctx.lineTo(50, 102)
        ctx.lineTo(50 + text.width, 102)
        ctx.stroke()
        ctx.restore()
        const id = ctx.getImageData(0, 0, 200, 200).data.buffer;
        client.emit("video", id)
    }, 1000 / 60)
    let offset = 0
    const audio = setInterval(() => {
        background.then(data => {
            const seconds = 5
            const chunkSize = data.sampleRate * seconds
            const max = data._channelData[0].byteLength / 4
            const start = Math.min(offset * chunkSize, max)
            const end = Math.min(start + chunkSize, max)
            const length = Math.min(chunkSize, end - start)
            const duration = length / data.sampleRate
            if(start < end) {
                client.emit("audio", {
                    id: data.id,
                    numberOfChannels: data.numberOfChannels,
                    sampleRate: data.sampleRate,
                    _channelData: data._channelData.map(channelData => {
                        return channelData.subarray(start, end)
                    }),
                    length,
                    duration,
                })
                offset++
            }
        })
    }, 1000)
    state.inputs = {}
    client.on("input", (name, value) => {
        state.inputs[name] = value
    })
    client.on("disconnect", () => {
        clearInterval(video)
        clearInterval(audio)
    })
});
server.listen(3000, () => console.log("server listening"));
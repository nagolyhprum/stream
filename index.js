const express = require('express')
const path = require("path")
const { createCanvas, loadImage } = require('canvas')
const audioLoader = require('audio-loader')
const http = require('http')
const socketIO = require('socket.io')

const group = (children, transform) => config => {
    const {context} = config
    const result = typeof transform === "function" ? transform(config.state) : transform
    if(result) {
        context.save()    
        if(result.translate) {
            const {x = 0, y = 0} = result.translate
            context.translate(x, y)
        }
        if(result.anchor) {
            const {x = 0, y = 0} = result.anchor
            context.translate(x, y)
        } 
        if(result.rotate) {
            context.rotate(result.rotate)
        }
        if(result.anchor) {
            const {x = 0, y = 0} = result.anchor
            context.translate(-x, -y)
        } 
    }
    context.beginPath()
    const next = children.reduce((next, child) => child({
        ...config,
        next
    }) || next, config.next)
    context.fill()
    context.stroke()
    if(transform) {
        context.restore()
    }
    return next
}

const text = (text, x, y) => ({context}) => {
    context.fillText(text, x, y)
    context.strokeText(text, x, y)
}

const fill = style => ({context}) => { 
    context.fillStyle = style
}

const stroke = style => ({context}) => {
    context.strokeStyle = style
}

const font = font => ({context}) => {
    context.font = font
}

const width = width => ({context}) => {
    context.lineWidth = width
}

const baseline = baseline => ({context}) => {
    context.textBaseline = baseline
}

const align = align => ({context}) => {
    context.textAlign = align
}

const move = (x, y) => ({context}) => {
    context.moveTo(x, y)
}

const line = (x, y) => ({context}) => {
    context.lineTo(x, y)
}

const close = ({context}) => {
    context.closePath()
}

const image = (src, x, y, dw, dh) => ({context, game}) => {
    context.drawImage(game.preload.images[src], x, y, dw, dh)
}

const update = callback => config => {
    return callback(config.next)
}

const withState = callback => config => {
    callback(config.state)(config)
}

const game = {
    width: 200,
    height: 200,
    preload: {
        images: {
            the_image: "the_image.png"
        },
        audio: {
            background: "eclaircie.mp3"
        }
    },
    screens: {
        main: group([
            image("the_image", 50, 50, 100, 100),
            group([
                move(10, 10),
                line(20, 20),
                line(10, 20),
                close,
                fill("blue"),
                stroke("yellow"),
                update(state => ({
                    ...state,
                    rotation: state.rotation + 2 * Math.PI * state.diff
                }))              
            ], (state) => ({
                rotate: state.rotation,
                anchor: {
                    x: 15,
                    y: 15
                }
            })),
            group([
                align("center"),
                baseline("top"),
                width(2),
                font("40px Times New Roman"),
                withState(state => {
                    return fill(state.rotation % (2 * Math.PI) < Math.PI ? "red" : "blue")
                }),
                stroke("green"),
                text("hello word", 50, 50 )
            ], {
                translate: {
                    x: 50,
                    y: 50
                }
            })
        ])
    }
}

const package = (game) => {
    const {preload:{images}} = game
    Object.keys(images).map(key => {
        return loadImage(path.join(__dirname, images[key])).then((data) => {
            images[key] = data
        })
    })
    const {preload:{audio}} = game
    Object.keys(audio).map(key => {
        return audioLoader(path.join(__dirname, audio[key])).then((data) => {
            audio[key] = data
        })
    })
    const {width, height} = game
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')
    return (state) => {
        context.clearRect(0, 0, width, height)
        const nextState = game.screens.main({
            context,
            game,
            state,
            next: state
        })
        return {
            imageData: context.getImageData(0, 0, width, height).data.buffer,
            nextState
        }
    }
}

const draw = package(game)

const app = express();
app.use(express.static(path.join(__dirname, "public")))
const server = http.createServer(app);
const io = socketIO(server);
io.on('connection', client => {
    let state = {
        rotation: 0,
        last_update: Date.now(),
        inputs: {}
    }
    const video = setInterval(() => {
        const now = Date.now()
        const diff = (now - state.last_update) / 1000
        const {
            imageData,
            nextState
        } = draw({
            ...state,
            diff
        })
        state = {
            ...nextState,
            last_update: now
        }
        client.emit("video", imageData)
    }, 1000 / 60)
    // let offset = 0
    // const audio = setInterval(() => {
    //     background.then(data => {
    //         const seconds = 5
    //         const chunkSize = data.sampleRate * seconds
    //         const max = data._channelData[0].byteLength / 4
    //         const start = Math.min(offset * chunkSize, max)
    //         const end = Math.min(start + chunkSize, max)
    //         const length = Math.min(chunkSize, end - start)
    //         const duration = length / data.sampleRate
    //         if(start < end) {
    //             client.emit("audio", {
    //                 id: data.id,
    //                 numberOfChannels: data.numberOfChannels,
    //                 sampleRate: data.sampleRate,
    //                 _channelData: data._channelData.map(channelData => {
    //                     return channelData.subarray(start, end)
    //                 }),
    //                 length,
    //                 duration,
    //             })
    //             offset++
    //         }
    //     })
    // }, 1000)
    client.on("input", (name, value) => {
        state.inputs[name] = value
    })
    client.on("disconnect", () => {
        clearInterval(video)
        // clearInterval(audio)
    })
});
server.listen(3000, () => console.log("server listening"));
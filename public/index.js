document.querySelector('body').addEventListener('click', function() {
    const socket = io();
    socket.on("connect", () => {
        console.log(socket.id);
    });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioNodes = {}
    const canvas = document.getElementById("canvas")
    const videoContext = canvas.getContext("2d")
    const fps = document.getElementById("fps")
    let total = 0
    let last = Date.now()
    setInterval(() => {
        fps.innerHTML = `${Math.floor(1000 / total)}`
    }, 1000)
    socket.on("video", (buffer) => {
        const now = Date.now()
        const diff = now - last;
        last = now;    
        total = (total + diff) / 2
        const array = new Uint8ClampedArray(buffer);
        const image = new ImageData(array, 200, 200);
        videoContext.putImageData(image, 0, 0)
    })
    socket.on("audio", (data) => {
        console.log(data)
        if(data.length / data.sampleRate !== data.duration) {
            console.error("mismatch length")
        }
        const dataLength = data._channelData[0].byteLength
        if(dataLength / data.sampleRate / 4 !== data.duration) {
            console.error("mismatch channel data")
        }
        const channels = data.numberOfChannels
        const length = data.length
        const sampleRate = data.sampleRate
        const audioBuffer = audioContext.createBuffer(channels, length, sampleRate);
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            audioBuffer.copyToChannel(new Float32Array(data._channelData[channel]), channel);
        }
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        const nextStartAt = audioNodes[data.id] || audioContext.currentTime
        source.start(nextStartAt)
        audioNodes[data.id] = nextStartAt + data.duration
    })
    socket.on("disconnect", () => {
        console.log(socket.id);
    });
})
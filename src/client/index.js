"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_client_1 = require("socket.io-client");
var started = false;
var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var audioNodes = {};
var canvas = document.getElementById('canvas');
var videoContext = canvas.getContext('2d');
var fps = document.getElementById('fps');
var total = 0;
var last = Date.now();
document.body.onclick = function () {
    if (started)
        return;
    started = true;
    var socket = socket_io_client_1.io();
    socket.on('connect', function () {
        console.log('connect', socket.id);
    });
    document.body.onkeydown = function (e) {
        socket.emit('input', {
            type: 'key',
            key: e.key,
            value: true
        });
    };
    document.body.onkeyup = function (e) {
        socket.emit('input', {
            type: 'key',
            key: e.key,
            value: false
        });
    };
    canvas.onmousemove = function (e) {
        var bounds = canvas.getBoundingClientRect();
        socket.emit('input', {
            type: 'move',
            x: e.pageX - bounds.x,
            y: e.pageY - bounds.y
        });
    };
    canvas.onclick = function (e) {
        var bounds = canvas.getBoundingClientRect();
        socket.emit('input', {
            type: 'click',
            x: e.pageX - bounds.x,
            y: e.pageY - bounds.y
        });
    };
    setInterval(function () {
        fps.innerHTML = "" + Math.floor(1000 / total);
    }, 1000);
    socket.on('video', function (_a) {
        var cursor = _a.cursor, imageData = _a.imageData;
        var now = Date.now();
        var diff = now - last;
        last = now;
        total = (total + diff) / 2;
        var array = new Uint8ClampedArray(imageData);
        var image = new ImageData(array, 200, 200);
        videoContext.putImageData(image, 0, 0);
        canvas.style.cursor = cursor;
    });
    socket.on('audio', function (data) {
        if (data.length / data.sampleRate !== data.duration) {
            console.error('mismatch length');
        }
        var dataLength = data._channelData[0].byteLength;
        if (dataLength / data.sampleRate / 4 !== data.duration) {
            console.error('mismatch channel data');
        }
        var channels = data.numberOfChannels;
        var length = data.length;
        var sampleRate = data.sampleRate;
        var audioBuffer = audioContext.createBuffer(channels, length, sampleRate);
        for (var channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            audioBuffer.copyToChannel(new Float32Array(data._channelData[channel]), channel);
        }
        var source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        var nextStartAt = audioNodes[data.id] || audioContext.currentTime;
        source.start(nextStartAt);
        audioNodes[data.id] = nextStartAt + data.duration;
    });
    socket.on('disconnect', function () {
        console.log('disconnect', socket.id);
    });
};

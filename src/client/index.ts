import {io} from 'socket.io-client';

let started = false;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioNodes: Record<string, number> = {};
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const videoContext = canvas.getContext('2d') as CanvasRenderingContext2D;
const fps = document.getElementById('fps') as HTMLDivElement;
let total = 0;
let last = Date.now();

document.body.onclick = () => {
	if(started) return; 
	started = true;
	const socket = io();
	socket.on('connect', () => {
		console.log('connect', socket.id);
	});
	document.body.onkeydown = e => {
		socket.emit('input', {
			type: 'key',
			key: e.key,
			value: true
		});
	};
	document.body.onkeyup = e => {
		socket.emit('input', {
			type: 'key',
			key: e.key,
			value: false
		});
	};
	canvas.onmousemove = e => {
		const bounds = canvas.getBoundingClientRect();
		socket.emit('input', {
			type: 'move',
			x: e.pageX - bounds.x,
			y: e.pageY - bounds.y
		});
	};
	canvas.onclick = e => {
		const bounds = canvas.getBoundingClientRect();
		socket.emit('input', {
			type: 'click',
			x: e.pageX - bounds.x,
			y: e.pageY - bounds.y
		});
	};
	setInterval(() => {
		fps.innerHTML = `${Math.floor(1000 / total)}`;
	}, 1000);
	socket.on('video', ({cursor, imageData}: VideoData) => {
		const now = Date.now();
		const diff = now - last;
		last = now;    
		total = (total + diff) / 2;
		const array = new Uint8ClampedArray(imageData);
		const image = new ImageData(array, 200, 200);
		videoContext.putImageData(image, 0, 0);
		canvas.style.cursor = cursor;
	});
	socket.on('audio', (data: AudioData) => {
		if(data.length / data.sampleRate !== data.duration) {
			console.error('mismatch length');
		}
		const dataLength = data._channelData[0].byteLength;
		if(dataLength / data.sampleRate / 4 !== data.duration) {
			console.error('mismatch channel data');
		}
		const channels = data.numberOfChannels;
		const length = data.length;
		const sampleRate = data.sampleRate;
		const audioBuffer = audioContext.createBuffer(channels, length, sampleRate);
		for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
			audioBuffer.copyToChannel(new Float32Array(data._channelData[channel]), channel);
		}
		const source = audioContext.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(audioContext.destination);
		const nextStartAt = audioNodes[data.id] || audioContext.currentTime;
		source.start(nextStartAt);
		audioNodes[data.id] = nextStartAt + data.duration;
	});
	socket.on('disconnect', () => {
		console.log('disconnect', socket.id);
	});
};
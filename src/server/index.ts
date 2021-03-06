import express from 'express';
import http from 'http';
import path from 'path';
import socketIO, { Socket } from 'socket.io';
import { Pong } from './pong';

const app = express();
app.use(express.static(path.join(__dirname, '..', 'client')));
const server = http.createServer(app);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const io = socketIO(server);
const connections = new Set<string>();
io.on('connection', (client: Socket) => {
	connections.add(client.id);
	let base: BaseState = {
		dirty: [],
		isNew: true,
		last_update: Date.now(),
		inputs: {},
		cursor: 'default',
		diff: 0,
		mouse: {
			move: {
				x: -1,
				y: -1
			},
			click: false
		},
		connection: '',
		connections: []
	};
	const video = setInterval(() => {  
		const now = Date.now();
		const {imageData, cursor, width, height} = Pong({
			...base,
			diff: (now - base.last_update) / 1000,
			connections: Array.from(connections),
			connection: client.id
		});
		base = {
			...base,
			mouse: {
				...base.mouse,
				click: false
			},
			dirty: [],
			inputs: {},
			isNew: false,
			last_update: now,
		};
		client.emit('video', {
			imageData,
			cursor,
			width,
			height
		});
	}, 1000 / 60);
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
	client.on('input', (config: InputData) => {
		switch(config.type) {
		case 'click':
			base = {
				...base,
				mouse: {
					...base.mouse,
					click: true
				}
			};
			break;
		case 'move':
			base = {
				...base,
				mouse: {
					...base.mouse,
					move: {
						x: config.x,
						y: config.y
					}
				}
			};
			break;
		case 'key':
			base = {
				...base,
				inputs: {
					...base.inputs,
					[config.key]: config.value
				}
			};
		}
	});
	client.on('disconnect', () => {
		clearInterval(video);
		// clearInterval(audio)
		connections.delete(client.id);
	});
});
server.listen(3000, () => console.log('server listening'));
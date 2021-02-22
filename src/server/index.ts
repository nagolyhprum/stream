import express from 'express';
import path from 'path';
import http from 'http';
import socketIO, { Socket } from 'socket.io';
import {game} from './game';

const app = express();
app.use(express.static(path.join(__dirname, '..', 'client')));
const server = http.createServer(app);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const io = socketIO(server);
io.on('connection', (client: Socket) => {
	let state: TestState = {
		rotation: 0,
		last_update: Date.now(),
		inputs: {},
		cursor: 'default',
		direction: 2 * Math.PI,
		diff: 0,
		mouse: {
			move: {
				x: -1,
				y: -1
			},
			click: false
		}
	};
	const video = setInterval(() => {
		const now = Date.now();
		const diff = (now - state.last_update) / 1000;
		const {
			imageData,
			nextState
		} = game({
			...state,
			diff,
			cursor: 'default'
		});
		if(nextState) {
			state = {
				...nextState,
				last_update: now,
				mouse: {
					...nextState.mouse,
					click: false
				}
			};
		}
		client.emit('video', {
			imageData,
			cursor: state.cursor
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
			state = {
				...state,
				mouse: {
					...state.mouse,
					click: true
				}
			};
			break;
		case 'move':
			state = {
				...state,
				mouse: {
					...state.mouse,
					move: {
						x: config.x,
						y: config.y
					}
				}
			};
			break;
		case 'key':
			state.inputs[config.key] = config.value;
		}
	});
	client.on('disconnect', () => {
		clearInterval(video);
		// clearInterval(audio)
	});
});
server.listen(3000, () => console.log('server listening'));
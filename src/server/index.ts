import TheImage from './the_image.png';
import Eclaire from './eclaircie.mp3';
import express from 'express';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import audioLoader from 'audio-loader';
import http from 'http';
import socketIO, { Socket } from 'socket.io';
import { Matrix } from 'ml-matrix';
import { pointInSvgPath } from 'point-in-svg-path';

const group = <State extends BaseState>(children: Array<Drawable<State>>, transform?: TransformState<State>): Drawable<State> => config => {
	const {context} = config;
	const result = typeof transform === 'function' ? transform(config.state) : transform;
	if(result) {
		context.save();  
		context.state.push(context.state[context.state.length - 1]);  
		if(result.translate) {
			const {x = 0, y = 0} = result.translate;
			context.translate(x, y);
			applyMatrix(context, new Matrix([
				[1, 0, x],
				[0, 1, y],
				[0, 0, 1]
			]));
		}
		if(result.anchor) {
			const {x = 0, y = 0} = result.anchor;
			context.translate(x, y);
			applyMatrix(context, new Matrix([
				[1, 0, x],
				[0, 1, y],
				[0, 0, 1]
			]));
		} 
		const {rotate} = result;
		if(rotate) {
			context.rotate(rotate);
			applyMatrix(context, new Matrix([
				[Math.cos(rotate), -Math.sin(rotate), 0],
				[Math.sin(rotate), Math.cos(rotate), 0],
				[0, 0, 1]
			]));
		}
		if(result.anchor) {
			const {x = 0, y = 0} = result.anchor;
			context.translate(-x, -y);
			applyMatrix(context, new Matrix([
				[1, 0, -x],
				[0, 1, -y],
				[0, 0, 1]
			]));
		} 
	}
	context.beginPath();
	context.path = [];
	const next = children.reduce((next, child) => child({
		...config,
		next
	}) || next, config.next);
	context.fill();
	context.stroke();
	if(transform) {
		context.restore();
		context.state.pop();  
	}
	return next;
};

const text = <State extends BaseState>(text: string, x: number, y: number): Drawable<State> => ({context}) => {
	context.fillText(text, x, y);
	context.strokeText(text, x, y);
};

const fill = <State extends BaseState>(style: string | CanvasGradient | CanvasPattern): Drawable<State> => ({context}) => { 
	context.fillStyle = style;
};

const stroke = <State extends BaseState>(style: string | CanvasGradient | CanvasPattern): Drawable<State> => ({context}) => {
	context.strokeStyle = style;
};

const font = <State extends BaseState>(font: string): Drawable<State> => ({context}) => {
	context.font = font;
};

const width = <State extends BaseState>(width: number): Drawable<State> => ({context}) => {
	context.lineWidth = width;
};

const baseline = <State extends BaseState>(baseline: CanvasTextBaseline): Drawable<State> => ({context}) => {
	context.textBaseline = baseline;
};

const align = <State extends BaseState>(align: CanvasTextAlign): Drawable<State> => ({context}) => {
	context.textAlign = align;
};

const applyState = ({context, x, y}: {
    context: CanvasRenderingContext2D,
    x: number,
    y: number
}): {
    x: number,
    y: number
} => {
	const state = context.state[context.state.length - 1];
	const result = state.mmul(new Matrix([
		[x],
		[y],
		[1]
	]));
	return {
		x: result.get(0, 0),
		y: result.get(1, 0)
	};
};

const move = <State extends BaseState>(x: number, y: number): Drawable<State> => ({context}) => {
	const point = applyState({context, x, y});
	context.path.push(`M${point.x} ${point.y}`);
	context.moveTo(x, y);
};

const line = <State extends BaseState>(x: number, y: number): Drawable<State> => ({context}) => {
	const point = applyState({context, x, y});
	context.path.push(`L${point.x} ${point.y}`);
	context.lineTo(x, y);
};

const close = <State extends BaseState>(): Drawable<State> => ({context}) => {
	context.path.push('Z');
	context.closePath();
};

const image = <State extends BaseState>(src: string, dx: number, dy: number, dw: number, dh: number): Drawable<State> => ({context, game}) => {
	context.drawImage(game.images[src], dx, dy, dw, dh);
};

const update = <State extends BaseState>(callback: (state: State) => State): Drawable<State> => config => {
	return callback(config.next);
};

const withState = <State extends BaseState>(callback: (state: State) => Drawable<State>): Drawable<State> => config => {
	callback(config.state)(config);
};

const click = <State extends BaseState>(callback: (state: State) => State): Drawable<State> => ({state, next, context}) => {
	const path = context.path.join('');
	const click = state.mouse.click;
	const move = state.mouse.move;
	const contains = pointInSvgPath(path, move.x, move.y);    
	if(contains && click) {
		return callback(next);
	}
	return {
		...next,
		cursor: contains ? 'pointer' : next.cursor
	};
};

const game: Game<TestState> = {
	width: 200,
	height: 200,
	preload: {
		images: {
			the_image: TheImage
		},
		audio: {
			background: Eclaire
		}
	},
	images: {},
	audio: {},
	screens: {
		main: group([
			image('the_image', 50, 50, 100, 100),
			group([
				move(10, 10),
				line(50, 50),
				line(10, 50),
				close(),
				click(state => ({
					...state,
					direction : -state.direction
				})),
				fill('blue'),
				stroke('yellow'),
				update(state => ({
					...state,
					rotation: state.rotation + state.direction * state.diff
				}))              
			], (state) => ({
				rotate: state.rotation,
				anchor: {
					x: 30,
					y: 30
				}
			})),
			group([
				align('center'),
				baseline('top'),
				width(2),
				font('40px Times New Roman'),
				withState(state => {
					return fill(state.rotation % (2 * Math.PI) < Math.PI ? 'red' : 'blue');
				}),
				stroke('green'),
				text('hello word', 50, 50 )
			], {
				translate: {
					x: 50,
					y: 50
				}
			})
		])
	}
};

const applyMatrix = (context: CanvasRenderingContext2D, matrix: Matrix) => {
	const index = context.state.length - 1;
	context.state[index] = context.state[index].mmul(matrix);
};

const pack = <State extends BaseState>(game: Game<State>) => {
	const {preload:{images}} = game;
	Object.keys(images).map(key => {
		return loadImage(path.join(__dirname, images[key])).then((data) => {
			game.images[key] = data;
		});
	});
	const {preload:{audio}} = game;
	Object.keys(audio).map(key => {
		return audioLoader(path.join(__dirname, audio[key])).then((data) => {
			game.audio[key] = data;
		});
	});
	const {width, height} = game;
	const canvas = createCanvas(width, height);
	const context = canvas.getContext('2d') as CanvasRenderingContext2D;
	context.state = [
		new Matrix([
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		])
	];
	context.path = [];
	return (state: State) => {
		context.clearRect(0, 0, width, height);
		const nextState = game.screens.main({
			context,
			game,
			state,
			next: state
		});
		return {
			imageData: context.getImageData(0, 0, width, height).data.buffer,
			nextState
		};
	};
};

const draw = pack(game);

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
		} = draw({
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
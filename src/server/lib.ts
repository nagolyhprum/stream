import audioLoader from 'audio-loader';
import { createCanvas, loadImage } from 'canvas';
import { Matrix } from 'ml-matrix';
import path from 'path';
import { pointInSvgPath } from 'point-in-svg-path';

const applyMatrix = (context: CanvasRenderingContext2D, matrix: Matrix) => {
	const index = context.state.length - 1;
	context.state[index] = context.state[index].mmul(matrix);
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

export const group = <State extends BaseState>(children: Array<Drawable<State>>, transform?: TransformState<State>): Drawable<State> => config => {
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
	const next = children.reduce<State>((next, child) => child({
		...config,
		next
	}) || next, {
		...config.next,
		bounds: null
	});
	context.fill();
	context.stroke();
	if(transform) {
		context.restore();
		context.state.pop();  
	}
	if(next.bounds) {
		if(next.bounds.max.x > next.bounds.min.x && next.bounds.max.y > next.bounds.min.y) {
			const x = next.bounds.min.x;
			const y = next.bounds.min.y;
			const width = next.bounds.max.x - x;
			const height = next.bounds.max.y - y;
			return dirty(context, {
				x,
				y,
				width,
				height
			}, next);
		}
	}
	return next;
};

const pushBounds = <State extends BaseState>(context: CanvasRenderingContext2D, {
	x,
	y,
}: {
	x: number,
	y: number,
}, next: State): State => {
	return {
		...next,
		bounds: next.bounds ? {
			min: {
				x: Math.min(next.bounds.min.x, x),
				y: Math.min(next.bounds.min.y, y)
			},
			max: {
				x: Math.min(next.bounds.max.x, x),
				y: Math.min(next.bounds.max.y, y)
			}
		} : {
			min: {
				x,
				y
			},
			max: {
				x,
				y
			}
		}
	};
};

const dirty = <State extends BaseState>(context: CanvasRenderingContext2D, {
	x,
	y,
	width,
	height,
	data = ''
}: {
	x: number,
	y: number,
	width: number,
	height: number,
	data?: string
}, next: State): State => {
	const girth = context.lineWidth;
	const dx = Math.max(0, x - girth);
	const dy = Math.max(0, y - girth);
	const dw = Math.min(context.canvas.width - dx, width + 2 * girth);
	const dh = Math.min(context.canvas.height - dy, height + 2 * girth);
	return {
		...next,
		dirty: [
			...next.dirty,
			{
				x: dx,
				y: dy,
				width: dw,
				height: dh,
				data,

				align: context.textAlign,
				baseline: context.textBaseline,
				fill: context.fill,
				stroke: context.stroke,
				font: context.font,
				girth: context.lineWidth,
			}
		]
	};
};

const getTextXOffset = (context: CanvasRenderingContext2D, width: number): number => {
	switch(context.textAlign) {
	case 'left': return 0;
	case 'center': return width / 2;
	case 'right': return width;
	}
	return 0;
};

const getTextYOffset = (context: CanvasRenderingContext2D, height: number): number => {
	switch(context.textBaseline) {
	case 'top': return 0;
	case 'middle': return height / 2;
	case 'bottom': return height;
	}
	return 0;
};

const getTextOffset = (context: CanvasRenderingContext2D, width: number, height: number): {
	x: number,
	y: number
} => {
	return {
		x: getTextXOffset(context, width),
		y: getTextYOffset(context, height),
	};
};

export const text = <State extends BaseState>(text: string, x: number, y: number): Drawable<State> => ({context, next}) => {
	context.fillText(text, x, y);
	context.strokeText(text, x, y);
	const width = context.measureText(text).width;
	const height = parseFloat(context.font);
	const point = applyState({context, x, y});
	const path = `M${point.x} ${point.y}L${point.x + width} ${point.y}L${point.x + width} ${point.y + height}L${point.x} ${point.y + height}Z`;
	context.path.push(path);
	const offset = getTextOffset(context, width, height);
	return dirty(context, {
		x: x - offset.x,
		y: y - offset.y,
		width,
		height,
	}, next);
};

export const fill = <State extends BaseState>(style: string | CanvasGradient | CanvasPattern): Drawable<State> => ({context}) => { 
	context.fillStyle = style;
};

export const stroke = <State extends BaseState>(style: string | CanvasGradient | CanvasPattern): Drawable<State> => ({context}) => {
	context.strokeStyle = style;
};

export const font = <State extends BaseState>(font: string): Drawable<State> => ({context}) => {
	context.font = font;
};

export const girth = <State extends BaseState>(width: number): Drawable<State> => ({context}) => {
	context.lineWidth = width;
};

export const baseline = <State extends BaseState>(baseline: CanvasTextBaseline): Drawable<State> => ({context}) => {
	context.textBaseline = baseline;
};

export const align = <State extends BaseState>(align: CanvasTextAlign): Drawable<State> => ({context}) => {
	context.textAlign = align;
};

export const move = <State extends BaseState>(x: number, y: number): Drawable<State> => ({context, next}) => {
	const point = applyState({context, x, y});
	context.path.push(`M${point.x} ${point.y}`);
	context.moveTo(x, y);
	return pushBounds(context, {
		x,
		y
	}, next);
};

export const line = <State extends BaseState>(x: number, y: number): Drawable<State> => ({context, next}) => {
	const point = applyState({context, x, y});
	context.path.push(`L${point.x} ${point.y}`);
	context.lineTo(x, y);
	return pushBounds(context, {
		x,
		y
	}, next);
};

export const close = <State extends BaseState>(): Drawable<State> => ({context}) => {
	context.path.push('Z');
	context.closePath();
};

export const image = <State extends BaseState>(src: string, dx: number, dy: number, dw: number, dh: number): Drawable<State> => ({context, game, next}) => {
	context.drawImage(game.images[src], dx, dy, dw, dh);
	return dirty(context, {
		x: dx,
		y: dy,
		width: dw,
		height: dh,
		data: src
	}, next);
};

export const update = <State extends BaseState>(callback: (state: State) => State): Drawable<State> => config => {
	return callback(config.next);
};

export const withState = <State extends BaseState>(callback: (state: State) => Drawable<State>): Drawable<State> => config => {
	return callback(config.state)(config);
};

export const click = <State extends BaseState>(callback: (state: State) => State): Drawable<State> => ({state, next, context}) => {
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

export const keydown = <State extends BaseState>(key: string, callback: (state: State) => State): Drawable<State> => ({state, next}) => {
	if(state.inputs[key] === true) {
		return callback(next);
	} else {
		return next;
	}
};

export const keyup = <State extends BaseState>(key: string, callback: (state: State) => State): Drawable<State> => ({state, next}) => {
	if(state.inputs[key] === false) {
		return callback(next);
	} else {
		return next;
	}
};

export const rect = <State extends BaseState>(x: number, y: number, width: number, height: number): Drawable<State> => ({context, next}) => {
	context.fillRect(x, y, width, height);
	context.strokeRect(x, y, width, height);
	const point = applyState({context, x, y});
	const path = `M${point.x} ${point.y}L${point.x + width} ${point.y}L${point.x + width} ${point.y + height}L${point.x} ${point.y + height}Z`;
	context.path.push(path);
	return dirty(context, {
		x,
		y,
		width,
		height
	}, next);
};

export const pack = <State extends BaseState>(game: Game<State>): (base: BaseState) => {
    imageData: Array<{
		data: ArrayBuffer,
		x: number,
		y: number,
		width: number,
		height: number
	}>,
	width: number,
	height: number,
    cursor: string,
} => {
	const {preload:{images}} = game;
	Object.keys(images).map(async key => {
		const data = await loadImage(path.join(__dirname, images[key]));
		game.images[key] = data;
	});
	const {preload:{audio}} = game;
	Object.keys(audio).map(async key => {
		const data = await audioLoader(path.join(__dirname, audio[key]));
		game.audio[key] = data;
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
	let state = game.init();

	return (base: BaseState) => {
		context.clearRect(0, 0, width, height);
		const build = base.isNew ? game.connect({
			...state,
			...base,
		} as State) : {
			...state,
			...base,
		} as State;
		const screen = game.getScreen(build);
		const next = game.screens[screen]({
			context,
			game,
			state: build,
			next: build
		}) || build;
		const imageData = [...((state as State).dirty ?? []), ...next.dirty].map(dirty => {
			return {
				x: dirty.x,
				y: dirty.y,
				width: dirty.width,
				height: dirty.height,
				data: context.getImageData(dirty.x, dirty.y, dirty.width, dirty.height).data.buffer
			};
		});
		state = next;
		return {			
			width,
			height,
			imageData,
			cursor: next.cursor
		};
	};
};
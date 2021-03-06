import {
	align,
	baseline,
	click,
	fill,
	font,








	girth, group,
	keydown,
	keyup,
	pack,
	rect,
	stroke,
	text,
	update,

	withState
} from './lib';

const WIDTH = 640;
const HEIGHT = 480;
const BALL_SIZE = 10;
const PADDLE_SIZE = 50;
const PADDING = 50;
const PADDLE_SPEED = 50;

const getID = () => {
	const random = Math.random();
	const date = Date.now();
	return random.toString(16).slice(2) + date.toString(16);
};

const handleVelocity = (velocity: number) => (state: PongState): PongState => {
	const game = state.games[state.cache[state.connection]];
	const {paddle, left} = game;
	const which = state.connection === left ? 'left' : 'right';
	return {
		...state,
		games: {
			...state.games,
			[state.cache[state.connection]]: {
				...game,
				paddle: {
					...paddle,
					[which]: {
						...paddle[which],
						velocity: velocity
					}
				}
			}
		}
	};
};

export const Pong = pack<PongState>({
	width: WIDTH,
	height: HEIGHT,
	init: () => {
		return {
			screens: {},
			games: {},
			cache: {},
			pending: ''
		};
	},
	getScreen(state) {
		return state.screens[state.connection];
	},
	preload: {
		images: {},
		audio: {}
	},
	audio: {},
	images: {},
	connect: (state) => {
		return {
			...state,
			screens: {
				...state.screens,
				[state.connection]: 'landing'
			}
		};
	},
	screens: {
		landing: group([
			group([
				font('64px Courier New'),
				girth(2),
				fill('red'),
				stroke('white'),
				baseline('top'),
				align('left'),
				text('PONG', 50, 50)
			]),
			group([
				font('32px Courier New'),
				girth(2),
				fill('red'),
				stroke('white'),
				baseline('top'),
				align('left'),
				text('START', 50, 50 + 64),
				click(state => {
					const game = state.pending || getID();
					const left = state.games[game]?.left;
					return {
						...state,
						screens: {
							...state.screens,
							[state.connection]: 'game'
						},
						cache: {
							...state.cache,
							[state.connection]: game
						},
						pending: state.pending ? '' : game,
						games: {
							...state.games,
							[game]: {
								left: left ? left : state.connection,
								right: left ? state.connection : '',
								paddle: {
									left: {
										position: (HEIGHT / 2) - (PADDLE_SIZE / 2),
										velocity: 0
									},
									right: {
										position: (HEIGHT / 2) - (PADDLE_SIZE / 2),
										velocity: 0
									}
								},
								score: {
									left: 0,
									right: 0
								},
								ball: {
									x: (WIDTH / 2) - (BALL_SIZE / 2),
									y: (HEIGHT / 2) - (BALL_SIZE / 2),
									velocity: {
										x: 0,
										y: 0
									}
								}
							}
						}
					};
				})
			])
		]),
		game: group([
			keydown('w', handleVelocity(-PADDLE_SPEED)),
			keyup('w', handleVelocity(0)),
			keydown('s', handleVelocity(PADDLE_SPEED)),
			keyup('s', handleVelocity(0)),
			update(state => {
				const game = state.games[state.cache[state.connection]];
				const {paddle} = game;
				return {
					...state,
					games: {
						...state.games,
						[state.cache[state.connection]]: {
							...game,
							paddle: {
								left: {
									...paddle.left,
									position: paddle.left.position + paddle.left.velocity * state.diff
								},
								right: {
									...paddle.right,
									position: paddle.right.position + paddle.right.velocity * state.diff
								}
							}
						}
					}
				};
			}),
			girth(0),
			fill('white'),
			stroke('transparent'),            
			rect(0, PADDING, WIDTH, BALL_SIZE),
			rect(0, HEIGHT - BALL_SIZE - PADDING, WIDTH, BALL_SIZE),
			withState(state => {
				const {paddle, ball, score, right} = state.games[state.cache[state.connection]];
				return group([
					rect(PADDING, paddle.left.position, BALL_SIZE, PADDLE_SIZE),
					right ? rect(WIDTH - BALL_SIZE - PADDING, paddle.right.position, BALL_SIZE, PADDLE_SIZE) : group([]),
					rect(ball.x, ball.y, BALL_SIZE, BALL_SIZE),
					baseline('middle'),
					align('left'),
					text(`${score.left}`, PADDING / 2, PADDING / 2),
					align('right'),
					text(`${score.right}`, WIDTH - PADDING / 2, PADDING / 2)
				]);
			})
		])
	}
});
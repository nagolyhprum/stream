import TheImage from './the_image.png';
import Eclaire from './eclaircie.mp3';

import {
	group,
	image,
	move,
	line,
	click,
	fill,
	stroke,
	update,
	close,
	align,
	baseline,
	font,
	width,
	withState,
	text,
	pack
} from './lib';

export const game = pack<TestState>({
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
	init() {
		return {
			users: {}
		};
	},
	connect(state: TestState): TestState {
		return {
			...state,
			users: {
				...state.users,
				[state.connection]: {
					rotation: 0,
					direction: 2 * Math.PI
				}
			}
		};
	},
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
					users: {
						...state.users,
						[state.connection]: {
							...state.users[state.connection],
							direction: -state.users[state.connection].direction
						}
					}
				})),
				fill('blue'),
				stroke('yellow'),
				update(state => ({
					...state,
					users: {
						...state.users,
						[state.connection]: {
							...state.users[state.connection],
							rotation: state.users[state.connection].rotation + state.users[state.connection].direction * state.diff
						}
					}
				}))              
			], (state) => ({
				rotate: state.users[state.connection].rotation,
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
					return fill(state.users[state.connection].rotation % (2 * Math.PI) < Math.PI ? 'red' : 'blue');
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
});
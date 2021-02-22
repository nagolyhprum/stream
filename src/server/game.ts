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
});
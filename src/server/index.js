"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var the_image_png_1 = __importDefault(require("./the_image.png"));
var eclaircie_mp3_1 = __importDefault(require("./eclaircie.mp3"));
var express_1 = __importDefault(require("express"));
var path_1 = __importDefault(require("path"));
var canvas_1 = require("canvas");
var audio_loader_1 = __importDefault(require("audio-loader"));
var http_1 = __importDefault(require("http"));
var socket_io_1 = __importDefault(require("socket.io"));
var ml_matrix_1 = require("ml-matrix");
var point_in_svg_path_1 = require("point-in-svg-path");
var group = function (children, transform) { return function (config) {
    var context = config.context;
    var result = typeof transform === 'function' ? transform(config.state) : transform;
    if (result) {
        context.save();
        context.state.push(context.state[context.state.length - 1]);
        if (result.translate) {
            var _a = result.translate, _b = _a.x, x = _b === void 0 ? 0 : _b, _c = _a.y, y = _c === void 0 ? 0 : _c;
            context.translate(x, y);
            applyMatrix(context, new ml_matrix_1.Matrix([
                [1, 0, x],
                [0, 1, y],
                [0, 0, 1]
            ]));
        }
        if (result.anchor) {
            var _d = result.anchor, _e = _d.x, x = _e === void 0 ? 0 : _e, _f = _d.y, y = _f === void 0 ? 0 : _f;
            context.translate(x, y);
            applyMatrix(context, new ml_matrix_1.Matrix([
                [1, 0, x],
                [0, 1, y],
                [0, 0, 1]
            ]));
        }
        var rotate = result.rotate;
        if (rotate) {
            context.rotate(rotate);
            applyMatrix(context, new ml_matrix_1.Matrix([
                [Math.cos(rotate), -Math.sin(rotate), 0],
                [Math.sin(rotate), Math.cos(rotate), 0],
                [0, 0, 1]
            ]));
        }
        if (result.anchor) {
            var _g = result.anchor, _h = _g.x, x = _h === void 0 ? 0 : _h, _j = _g.y, y = _j === void 0 ? 0 : _j;
            context.translate(-x, -y);
            applyMatrix(context, new ml_matrix_1.Matrix([
                [1, 0, -x],
                [0, 1, -y],
                [0, 0, 1]
            ]));
        }
    }
    context.beginPath();
    context.path = [];
    var next = children.reduce(function (next, child) { return child(__assign(__assign({}, config), { next: next })) || next; }, config.next);
    context.fill();
    context.stroke();
    if (transform) {
        context.restore();
        context.state.pop();
    }
    return next;
}; };
var text = function (text, x, y) { return function (_a) {
    var context = _a.context;
    context.fillText(text, x, y);
    context.strokeText(text, x, y);
}; };
var fill = function (style) { return function (_a) {
    var context = _a.context;
    context.fillStyle = style;
}; };
var stroke = function (style) { return function (_a) {
    var context = _a.context;
    context.strokeStyle = style;
}; };
var font = function (font) { return function (_a) {
    var context = _a.context;
    context.font = font;
}; };
var width = function (width) { return function (_a) {
    var context = _a.context;
    context.lineWidth = width;
}; };
var baseline = function (baseline) { return function (_a) {
    var context = _a.context;
    context.textBaseline = baseline;
}; };
var align = function (align) { return function (_a) {
    var context = _a.context;
    context.textAlign = align;
}; };
var applyState = function (_a) {
    var context = _a.context, x = _a.x, y = _a.y;
    var state = context.state[context.state.length - 1];
    var result = state.mmul(new ml_matrix_1.Matrix([
        [x],
        [y],
        [1]
    ]));
    return {
        x: result.get(0, 0),
        y: result.get(1, 0)
    };
};
var move = function (x, y) { return function (_a) {
    var context = _a.context;
    var point = applyState({ context: context, x: x, y: y });
    context.path.push("M" + point.x + " " + point.y);
    context.moveTo(x, y);
}; };
var line = function (x, y) { return function (_a) {
    var context = _a.context;
    var point = applyState({ context: context, x: x, y: y });
    context.path.push("L" + point.x + " " + point.y);
    context.lineTo(x, y);
}; };
var close = function () { return function (_a) {
    var context = _a.context;
    context.path.push('Z');
    context.closePath();
}; };
var image = function (src, dx, dy, dw, dh) { return function (_a) {
    var context = _a.context, game = _a.game;
    context.drawImage(game.images[src], dx, dy, dw, dh);
}; };
var update = function (callback) { return function (config) {
    return callback(config.next);
}; };
var withState = function (callback) { return function (config) {
    callback(config.state)(config);
}; };
var click = function (callback) { return function (_a) {
    var state = _a.state, next = _a.next, context = _a.context;
    var path = context.path.join('');
    var click = state.mouse.click;
    var move = state.mouse.move;
    var contains = point_in_svg_path_1.pointInSvgPath(path, move.x, move.y);
    if (contains && click) {
        return callback(next);
    }
    return __assign(__assign({}, next), { cursor: contains ? 'pointer' : next.cursor });
}; };
var game = {
    width: 200,
    height: 200,
    preload: {
        images: {
            the_image: the_image_png_1.default
        },
        audio: {
            background: eclaircie_mp3_1.default
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
                click(function (state) { return (__assign(__assign({}, state), { direction: -state.direction })); }),
                fill('blue'),
                stroke('yellow'),
                update(function (state) { return (__assign(__assign({}, state), { rotation: state.rotation + state.direction * state.diff })); })
            ], function (state) { return ({
                rotate: state.rotation,
                anchor: {
                    x: 30,
                    y: 30
                }
            }); }),
            group([
                align('center'),
                baseline('top'),
                width(2),
                font('40px Times New Roman'),
                withState(function (state) {
                    return fill(state.rotation % (2 * Math.PI) < Math.PI ? 'red' : 'blue');
                }),
                stroke('green'),
                text('hello word', 50, 50)
            ], {
                translate: {
                    x: 50,
                    y: 50
                }
            })
        ])
    }
};
var applyMatrix = function (context, matrix) {
    var index = context.state.length - 1;
    context.state[index] = context.state[index].mmul(matrix);
};
var pack = function (game) {
    var images = game.preload.images;
    Object.keys(images).map(function (key) {
        return canvas_1.loadImage(path_1.default.join(__dirname, images[key])).then(function (data) {
            game.images[key] = data;
        });
    });
    var audio = game.preload.audio;
    Object.keys(audio).map(function (key) {
        return audio_loader_1.default(path_1.default.join(__dirname, audio[key])).then(function (data) {
            game.audio[key] = data;
        });
    });
    var width = game.width, height = game.height;
    var canvas = canvas_1.createCanvas(width, height);
    var context = canvas.getContext('2d');
    context.state = [
        new ml_matrix_1.Matrix([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ])
    ];
    context.path = [];
    return function (state) {
        context.clearRect(0, 0, width, height);
        var nextState = game.screens.main({
            context: context,
            game: game,
            state: state,
            next: state
        });
        return {
            imageData: context.getImageData(0, 0, width, height).data.buffer,
            nextState: nextState
        };
    };
};
var draw = pack(game);
var app = express_1.default();
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'client')));
var server = http_1.default.createServer(app);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
var io = socket_io_1.default(server);
io.on('connection', function (client) {
    var state = {
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
    var video = setInterval(function () {
        var now = Date.now();
        var diff = (now - state.last_update) / 1000;
        var _a = draw(__assign(__assign({}, state), { diff: diff, cursor: 'default' })), imageData = _a.imageData, nextState = _a.nextState;
        if (nextState) {
            state = __assign(__assign({}, nextState), { last_update: now, mouse: __assign(__assign({}, nextState.mouse), { click: false }) });
        }
        client.emit('video', {
            imageData: imageData,
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
    client.on('input', function (config) {
        switch (config.type) {
            case 'click':
                state = __assign(__assign({}, state), { mouse: __assign(__assign({}, state.mouse), { click: true }) });
                break;
            case 'move':
                state = __assign(__assign({}, state), { mouse: __assign(__assign({}, state.mouse), { move: {
                            x: config.x,
                            y: config.y
                        } }) });
                break;
            case 'key':
                state.inputs[config.key] = config.value;
        }
    });
    client.on('disconnect', function () {
        clearInterval(video);
        // clearInterval(audio)
    });
});
server.listen(3000, function () { return console.log('server listening'); });

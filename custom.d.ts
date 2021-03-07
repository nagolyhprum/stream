declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.mp3' {
    const content: string;
    export default content;
}

declare module 'canvas' {
    export const createCanvas: (width: number, height: number) => HTMLCanvasElement;
    export const loadImage: (uri: string) => Promise<CanvasImageSource>;
}

declare module 'audio-loader' {
    const content: (uri: string) => Promise<AudioData>;
    export default content;
}

declare module 'point-in-svg-path' {
    export const pointInSvgPath: (path: string, x: number, y: number) => boolean;
}

interface DrawableConfig<State extends BaseState> {
    game: Game<State>
    context: CanvasRenderingContext2D
    state: State
    next: State    
}

interface PongState extends BaseState {
    screens: Record<string, string>
    cache: Record<string, string>
    games: Record<string, {
        left: string
        right: string
        paddle: {
            left: {
                position: number
                velocity: number
            },
            right: {
                position: number
                velocity: number
            }
        },
        ball: {
            x: number,
            y: number,
            velocity: {
                x: number,
                y: number
            }
        },
        score: {
            left: number,
            right: number
        }
    }>
    pending: string
}

type Drawable<State extends BaseState> = (config: DrawableConfig<State>) => State | void;

interface VideoData {
    cursor: 'pointer' | 'default'
    imageData: Array<{
        data: ArrayBuffer,
        x: number,
        y: number,
        width: number,
        height: number
    }>
    width: number
    height: number
}

interface AudioData {
    id: string
    sampleRate: number
    duration: number
    length: number
    numberOfChannels: number
    _channelData: ArrayBuffer[]
}

interface Window {
    webkitAudioContext: typeof AudioContext
}

interface Rect {
    x: number
    y: number
    width: number
    height: number
}

interface CanvasRenderingContext2D {
    state: Array<import('ml-matrix').Matrix>
}

interface Transform {
    translate?: {
        x?: number
        y?: number
    }
    anchor?: {
        x?: number
        y?: number
    }
    rotate?: number
}

type TransformState<State extends BaseState> = ((state: State) => Transform) | Transform

interface Dirty {
    x: number,
    y: number,
    width: number,
    height: number,

    girth: number
    fill: string
    stroke: string
    font: string
    baseline: string
    align: string
    data: string
}

interface BaseState {
    bounds?: {
        min: {
            x: number,
            y: number
        }
        max: {
            x: number,
            y: number
        }
    }
    dirty: Array<Dirty>
    isNew: boolean
    last_update: number
    diff: number
    cursor: string
    inputs: Record<string, boolean>
    mouse: {
        click: boolean
        move: {
            x: number
            y: number
        }
    }
    connections: string[]
    connection: string
}

interface TestState extends BaseState {
    users: Record<string, {
        direction: number
        rotation: number
    }>
}

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]: T[P] };

interface Game<State extends BaseState> {
    width: number
    height: number
    init(): Without<State, BaseState>
    connect(state: State): State
    preload: {
        images: Record<string, string>
        audio: Record<string, string>
    }
    audio: Record<string, AudioData>
    images: Record<string, CanvasImageSource>
    screens: Record<string, Drawable<State>>
    getScreen: (state: State) => string
}

type InputData = {
    type: 'click'
} | {
    type: 'move'
    x: number
    y: number
} | {
    type: 'key'
    key: string
    value: boolean
}
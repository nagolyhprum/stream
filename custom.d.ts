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

interface DrawableConfig<State> {
    game: Game<State>
    context: CanvasRenderingContext2D
    state: State
    next: State    
}

type Drawable<State> = (config: DrawableConfig<State>) => State | void;

interface VideoData {
    cursor: 'pointer' | 'default'
    imageData: ArrayBuffer
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

interface CanvasRenderingContext2D {
    state: Array<import('ml-matrix').Matrix>
    path: string[]
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

type TransformState<State> = ((state: State) => Transform) | Transform

interface BaseState {
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
}

interface TestState extends BaseState {
    direction: number
    rotation: number
}

interface Game<State> {
    width: number
    height: number
    preload: {
        images: Record<string, string>
        audio: Record<string, string>
    }
    audio: Record<string, AudioData>
    images: Record<string, CanvasImageSource>
    screens: Record<string, Drawable<State>>
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
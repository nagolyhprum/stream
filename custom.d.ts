declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.mp3' {
    const content: string;
    export default content;
}

interface DrawableConfig<State> {
    context: CanvasRenderingContext2D
    state: State
    next: State    
}

type Drawable = <State>(config: DrawableConfig<State>) => State;

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
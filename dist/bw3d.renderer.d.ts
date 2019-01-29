declare module BW3D {
    class Renderer {
        monitor: Monitor;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        scene: BABYLON.Scene;
        devices: {};
        interfaceMetrics: {};
        updatedMetrics: boolean;
        ticked: boolean;
        tickerFunction: any;
        static HeartBeat: number;
        static SphericalHarmonics: number;
        static Boxes: number;
        static Gauge: number;
        constructor(monitor: Monitor, type: number);
        start(): Renderer;
        notify(message: string): Renderer;
        timeLerp(currentValue: number, targetValue: number, targetDate: number): number;
        formatFixed(nb: number, fix: number): string;
        maximum(val1: number, val2: number): number;
        startTicker(delay: number): void;
        beatScale(time: number, shift: number, scaling: number, scalingFactor: number, minScaling: number, sign: number): number;
        logarize(val: number, amplification: number, factor: number): number;
    }
}

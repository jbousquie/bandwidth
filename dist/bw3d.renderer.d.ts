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
        constructor(monitor: Monitor, type: number);
        start(): Renderer;
        notify(message: string): Renderer;
        timeLerp(currentValue: number, targetValue: number, targetDate: number): number;
        startTicker(delay: number): void;
    }
}

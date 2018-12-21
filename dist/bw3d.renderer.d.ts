declare module BW3D {
    class Renderer {
        monitor: Monitor;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        scene: BABYLON.Scene;
        devices: {};
        interfaceMetrics: {};
        updatedMetrics: boolean;
        static HeartBeat: number;
        constructor(monitor: Monitor, type: number);
        start(): Renderer;
        notify(message: string): Renderer;
    }
}

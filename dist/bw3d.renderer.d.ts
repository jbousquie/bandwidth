declare module BW3D {
    class Renderer {
        monitor: Monitor;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        scene: BABYLON.Scene;
        devices: {};
        static HeartBeat: number;
        constructor(monitor: Monitor, type: number);
        start(): void;
    }
    class BJSScene {
        renderer: Renderer;
        type: number;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        scene: BABYLON.Scene;
        devices: {};
        constructor(renderer: Renderer, type: number);
    }
}

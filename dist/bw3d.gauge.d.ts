declare module BW3D {
    class Gauge {
        scene: BABYLON.Scene;
        renderer: Renderer;
        monitor: Monitor;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        devices: {};
        interfaceMetrics: {};
        mesh: BABYLON.Mesh;
        tickDuration: number;
        reached: boolean;
        constructor(renderer: Renderer);
        createScene(): BABYLON.Scene;
    }
}

declare module BW3D {
    class Boxes {
        scene: BABYLON.Scene;
        renderer: Renderer;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        devices: {};
        interfaceMetrics: {};
        tickDuration: number;
        constructor(renderer: Renderer);
        createScene(): BABYLON.Scene;
    }
}

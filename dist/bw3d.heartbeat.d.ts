declare module BW3D {
    class HeartBeat {
        scene: BABYLON.Scene;
        renderer: Renderer;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        devices: {};
        interfaceMetrics: {};
        ifaces3d: {};
        ifaceMetrics: {};
        constructor(renderer: Renderer);
    }
}

declare module BW3D {
    class Boxes {
        scene: BABYLON.Scene;
        renderer: Renderer;
        monitor: Monitor;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        devices: {};
        interfaceMetrics: {};
        ifaces3d: {};
        tickDuration: number;
        constructor(renderer: Renderer);
        createGUI(device: Device, paths: BABYLON.Vector3[][]): void;
        createScene(): BABYLON.Scene;
    }
}

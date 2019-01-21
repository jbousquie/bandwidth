declare module BW3D {
    class HeartBeat {
        scene: BABYLON.Scene;
        renderer: Renderer;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        devices: {};
        interfaceMetrics: {};
        ifaces3d: {};
        tickDuration: number;
        constructor(renderer: Renderer);
        rgbString(val: number): string;
        createGUI(): void;
        createScene(): BABYLON.Scene;
    }
}

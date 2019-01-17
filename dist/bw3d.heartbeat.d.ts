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
        tickDuration: number;
        constructor(renderer: Renderer);
        beatScale(time: number, shift: number, scaling: number, minScaling: number, sign: number): number;
        logarize(val: number, factor: number): number;
        maximum(val1: number, val2: number): number;
        createGUI(): void;
        createScene(): BABYLON.Scene;
    }
}

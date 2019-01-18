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
        beatScale(time: number, shift: number, scaling: number, minScaling: number, sign: number): number;
        logarize(val: number, factor: number): number;
        rgbString(val: number): string;
        createGUI(): void;
        createScene(): BABYLON.Scene;
    }
}

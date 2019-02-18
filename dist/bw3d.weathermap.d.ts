declare module BW3D {
    class WeatherMap {
        scene: BABYLON.Scene;
        renderer: Renderer;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        devices: {};
        interfaceMetrics: {};
        ifaces3d: {};
        tickDuration: number;
        reached: boolean;
        constructor(renderer: Renderer);
        createGUI(): void;
        createScene(): BABYLON.Scene;
    }
}

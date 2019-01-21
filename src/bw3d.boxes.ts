module BW3D {

    export class Boxes {
        public scene: BABYLON.Scene;
        public renderer: Renderer;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public devices: {};
        public interfaceMetrics: {}
        public tickDuration: number = 12000;

        constructor(renderer: Renderer) {
            this.renderer = renderer;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            this.interfaceMetrics = renderer.interfaceMetrics;

            this.scene = this.createScene();
        }

        public createScene(): BABYLON.Scene {
            const renderer = this.renderer;
            const canvas = this.canvas;
            const engine = this.engine;
            const interfaceMetrics = this.interfaceMetrics;
            const delay = this.tickDuration;

            const beatScale = renderer.beatScale;
            const logarize = renderer.logarize;

            // Scene
            const scene = new BABYLON.Scene(engine);
            return scene;
        }
    }
}
module BW3D {
    export class Renderer {
        public monitor: Monitor;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public scene: BABYLON.Scene;
        public devices: {};

        public static HeartBeat = 0;

        constructor(monitor: Monitor, type: number) {
            this.monitor = monitor;
            this.devices = this.monitor.devices;

            // creation de la scene 3D et du compteur FPS
            const canvas = <HTMLCanvasElement>document.querySelector('#renderCanvas');
            const engine = new BABYLON.Engine(canvas, true);
            this.engine = engine;
            this.canvas = canvas;

            const bjsScene = new BJSScene(this, type);
            const scene = bjsScene.scene;
            window.addEventListener("resize", function() {
                engine.resize();
            });

            this.scene = scene;
        }

        public start() {
            const limit = 20;
            let count = 0;
            let fps = 0;
            const fpsElem = document.querySelector("#fps");
            const engine = this.engine;
            const scene = this.scene;
            engine.runRenderLoop(function(){
                count++;
                scene.render();
                if (count == limit) {
                    fps = Math.floor(engine.getFps());
                    fpsElem.innerHTML = fps.toString() + " fps";
                    count = 0;
                }
            });
        }
    }
    export class BJSScene {
        public renderer: Renderer;
        public type: number;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public scene: BABYLON.Scene;
        public devices: {};

        constructor(renderer: Renderer, type: number) {
            this.renderer = renderer;
            this.type = type;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;

            var scene: BABYLON.Scene;
            switch( type ){
                case Renderer.HeartBeat:
                    let hb = new HeartBeat(this.engine, this.canvas, this.devices);
                    scene = hb.scene;
                    break;
                default:
                    hb = new HeartBeat(this.engine, this.canvas, this.devices);
                    scene = hb.scene;
            }
            this.scene = scene;
        }
    }
}
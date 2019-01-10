module BW3D {
    export class Renderer {
        public monitor: Monitor;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public scene: BABYLON.Scene;
        public devices: {};
        public interfaceMetrics: {}
        public updatedMetrics: boolean = false;

        // Types de visualisation possibles
        public static HeartBeat = 0;

        constructor(monitor: Monitor, type: number) {
            this.monitor = monitor;
            this.interfaceMetrics = monitor.interfaceMetrics;
            this.devices = monitor.devices;

            // creation de la scene 3D et du compteur FPS
            const canvas = <HTMLCanvasElement>document.querySelector('#renderCanvas');
            const engine = new BABYLON.Engine(canvas, true);
            this.engine = engine;
            this.canvas = canvas;

            var scene: BABYLON.Scene;
            switch( type ){
                case Renderer.HeartBeat:
                    let hb = new HeartBeat(this);
                    scene = hb.scene;
                    break;
                default:
                    hb = new HeartBeat(this);
                    scene = hb.scene;
            }

            window.addEventListener("resize", function() {
                engine.resize();
            });

            this.scene = scene;
        }

        public start(): Renderer {
            const limit = 20;
            let count = 0;
            let fps = 0;
            const fpsElem = document.querySelector("#fps");
            const engine = this.engine;
            const scene = this.scene;
            const monitor = this.monitor;
            engine.runRenderLoop(function(){
                count++;
                scene.render();
                if (count == limit) {
                    fps = Math.floor(engine.getFps());
                    fpsElem.innerHTML = fps.toString() + " fps";
                    count = 0;
                }
            });
            return this;
        }

        // Traitement des notifications depuis le Monitor
        public notify(message: string): Renderer {
            switch (message) {
                case "metrics":
                    this.updatedMetrics = true;
                    break;
            }
            return this;
        }

        // Fonctions communes à tous les types de rendus
        // ...
    }
}
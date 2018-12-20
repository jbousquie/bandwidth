var BW3D;
(function (BW3D) {
    class Renderer {
        constructor(monitor, type) {
            this.monitor = monitor;
            this.devices = this.monitor.devices;
            // creation de la scene 3D et du compteur FPS
            const canvas = document.querySelector('#renderCanvas');
            const engine = new BABYLON.Engine(canvas, true);
            this.engine = engine;
            this.canvas = canvas;
            const bjsScene = new BJSScene(this, type);
            const scene = bjsScene.scene;
            window.addEventListener("resize", function () {
                engine.resize();
            });
            this.scene = scene;
        }
        start() {
            const limit = 20;
            let count = 0;
            let fps = 0;
            const fpsElem = document.querySelector("#fps");
            const engine = this.engine;
            const scene = this.scene;
            engine.runRenderLoop(function () {
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
    Renderer.HeartBeat = 0;
    BW3D.Renderer = Renderer;
    class BJSScene {
        constructor(renderer, type) {
            this.renderer = renderer;
            this.type = type;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            var scene;
            switch (type) {
                case Renderer.HeartBeat:
                    let hb = new BW3D.HeartBeat(this.engine, this.canvas, this.devices);
                    scene = hb.scene;
                    break;
                default:
                    hb = new BW3D.HeartBeat(this.engine, this.canvas, this.devices);
                    scene = hb.scene;
            }
            this.scene = scene;
        }
    }
    BW3D.BJSScene = BJSScene;
})(BW3D || (BW3D = {}));
//# sourceMappingURL=bw3d.renderer.js.map
var BW3D;
(function (BW3D) {
    class Renderer {
        constructor(monitor, type) {
            this.updatedMetrics = false;
            this.ticked = false;
            this.monitor = monitor;
            this.interfaceMetrics = monitor.interfaceMetrics;
            this.devices = monitor.devices;
            // creation de la scene 3D et du compteur FPS
            const canvas = document.querySelector('#renderCanvas');
            const engine = new BABYLON.Engine(canvas, true);
            this.engine = engine;
            this.canvas = canvas;
            var scene;
            switch (type) {
                case Renderer.HeartBeat:
                    let hb = new BW3D.HeartBeat(this);
                    scene = hb.scene;
                    break;
                default:
                    hb = new BW3D.HeartBeat(this);
                    scene = hb.scene;
            }
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
            const monitor = this.monitor;
            engine.runRenderLoop(function () {
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
        notify(message) {
            switch (message) {
                case "metrics":
                    this.updatedMetrics = true;
                    break;
            }
            return this;
        }
        // Fonctions communes à tous les types de rendus
        // Retourne la valeur suivante depuis currentValue pour atteindre targetValue à targetDate
        timeLerp(currentValue, targetValue, targetDate) {
            let val = currentValue;
            let deltaTime = targetDate - Date.now();
            let deltaValue = (targetValue - currentValue);
            if (deltaTime >= 0) {
                val = val + deltaValue * this.engine.getDeltaTime() / deltaTime;
            }
            return val;
        }
        // Démarre un ticker avec la période passée qui met simplement à jour this.ticked
        startTicker(delay) {
            const that = this;
            const handler = function () {
                that.ticked = true;
            };
            this.tickerFunction = window.setInterval(handler, delay);
            window.addEventListener("unload", function (e) {
                window.clearInterval(that.tickerFunction);
            });
        }
    }
    // Types de visualisation possibles
    Renderer.HeartBeat = 0;
    BW3D.Renderer = Renderer;
})(BW3D || (BW3D = {}));
//# sourceMappingURL=bw3d.renderer.js.map
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
                case Renderer.SphericalHarmonics:
                    let sh = new BW3D.SphericalHarmonics(this);
                    scene = sh.scene;
                    break;
                case Renderer.Boxes:
                    let bx = new BW3D.Boxes(this);
                    scene = bx.scene;
                    break;
                case Renderer.Gauge:
                    let gg = new BW3D.Gauge(this);
                    scene = gg.scene;
                    break;
                case Renderer.WeatherMap:
                    let wm = new BW3D.WeatherMap(this);
                    scene = wm.scene;
                    break;
                default:
                    let def = new BW3D.HeartBeat(this);
                    scene = def.scene;
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
        // =============================================
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
        // Renvoie une string d'un nombre fixé et formaté (fix = nb de décimales) : 00.00 pour fix = 2 par exemple
        formatFixed(nb, fix) {
            let formatted = nb.toFixed(fix);
            if (formatted.length < fix + 3) {
                formatted = "0" + formatted;
            }
            return formatted;
        }
        // retourne le maximum de deux valeurs
        maximum(val1, val2) {
            let max = (val2 > val1) ? val2 : val1;
            return max;
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
        // retourne une valeur de scaling sous forme de pulsation en fonction du temps
        beatScale(time, shift, scaling, scalingFactor, minScaling, sign) {
            let val = (Math.cos(time + shift * sign) + 2. * Math.abs(Math.sin(time * 0.5 + shift * sign))) * scaling * scalingFactor + scaling * scalingFactor + minScaling;
            if (val < minScaling) {
                val = minScaling;
            }
            return val;
        }
        ;
        // retourne un log base 10 positif pour réduire visuellement l'amplitude de la variation 0 à 100de val
        logarize(val, amplification, factor) {
            let log = Math.log10(val * amplification + 1.0) * factor;
            return log;
        }
    }
    // Types de visualisation possibles
    Renderer.HeartBeat = 0;
    Renderer.SphericalHarmonics = 1;
    Renderer.Boxes = 2;
    Renderer.Gauge = 3;
    Renderer.WeatherMap = 4;
    BW3D.Renderer = Renderer;
})(BW3D || (BW3D = {}));
//# sourceMappingURL=bw3d.renderer.js.map
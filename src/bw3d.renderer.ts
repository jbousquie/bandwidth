module BW3D {
    export class Renderer {
        public monitor: Monitor;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public scene: BABYLON.Scene;
        public devices: {};
        public interfaceMetrics: {}
        public updatedMetrics: boolean = false;
        public ticked: boolean = false;
        public tickerFunction: any;

        // Types de visualisation possibles
        public static HeartBeat = 0;
        public static SphericalHarmonics = 1;
        public static Boxes = 2;
        public static Gauge = 3;

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
                case Renderer.SphericalHarmonics:
                    let sh = new SphericalHarmonics(this);
                    scene = sh.scene;
                    break;
                case Renderer.Boxes:
                    let bx = new Boxes(this);
                    scene = bx.scene;
                break;
                case Renderer.Gauge:
                    let gg = new Gauge(this);
                    scene = gg.scene;
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
        // =============================================
        // Retourne la valeur suivante depuis currentValue pour atteindre targetValue à targetDate
        public timeLerp(currentValue: number, targetValue: number, targetDate: number): number {
            let val = currentValue;
            let deltaTime = targetDate - Date.now();
            let deltaValue = (targetValue - currentValue);
            if (deltaTime >= 0) {
                val = val + deltaValue * this.engine.getDeltaTime() / deltaTime;
            }
            return val;
        }

        // Renvoie une string d'un nombre fixé et formaté (fix = nb de décimales) : 00.00 pour fix = 2 par exemple
        public formatFixed(nb: number, fix: number): string {
            let formatted = nb.toFixed(fix);
            if (formatted.length < fix + 3) {
                formatted = "0" + formatted;
            }
            return formatted;
        }
        // retourne le maximum de deux valeurs
        public maximum(val1 : number, val2: number): number {
            let max = (val2 > val1) ? val2 : val1;
            return max;
        }
        
        // Démarre un ticker avec la période passée qui met simplement à jour this.ticked
        public startTicker(delay: number) {
            const that = this;
            const handler = function() {
                that.ticked = true;
            }
            this.tickerFunction = window.setInterval(handler, delay);
            window.addEventListener("unload", function(e) {
                window.clearInterval(that.tickerFunction);
            });
        }

        // retourne une valeur de scaling sous forme de pulsation en fonction du temps
        public beatScale(time: number, shift: number, scaling: number, scalingFactor: number, minScaling: number, sign: number): number {
            let val = ( Math.cos(time + shift * sign) + 2. * Math.abs( Math.sin(time * 0.5 + shift * sign))) * scaling * scalingFactor + scaling * scalingFactor + minScaling;
            if (val < minScaling) {
                val = minScaling;
            }
            return val;
        };
        // retourne un log base 10 positif pour réduire visuellement l'amplitude de la variation 0 à 100de val
        public logarize(val: number, amplification: number, factor: number): number {
            let log = Math.log10(val * amplification + 1.0) * factor;
            return log;
        }
    }
}
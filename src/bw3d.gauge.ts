module BW3D {
    export class Gauge {
        public scene: BABYLON.Scene;
        public renderer: Renderer;
        public monitor: Monitor;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public devices: {};
        public interfaceMetrics: {}
        public mesh: BABYLON.Mesh;
        public tickDuration: number = 12000;
        public reached: boolean = false;

        constructor(renderer: Renderer) {
            this.renderer = renderer;
            this.monitor = renderer.monitor;
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

            // Scene
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.15, 0.2, 0.65);
            const camera = new BABYLON.ArcRotateCamera("cam", -Math.PI * 0.5, Math.PI * 0.5, 10.0, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
            //camera.wheelPrecision = 80;
            //camera.minZ = 0.001;
            const pl = new BABYLON.PointLight("pl", camera.position, scene);
            pl.intensity = 0.5;

            const needlemMat = new BABYLON.StandardMaterial("nm", scene);
            needlemMat.diffuseColor = BABYLON.Color3.Red();
            const needleLength = 2.0;
            const needle = BABYLON.MeshBuilder.CreateBox("b", {width: needleLength, height: 0.1, depth: 0.1}, scene);
            needle.setPivotPoint(new BABYLON.Vector3(-needleLength * 0.5, 0, 0));
            needle.setPositionWithLocalVector(new BABYLON.Vector3(needleLength * 0.5, 0, 0));
            needle.computeWorldMatrix(true);
            needle.material = needlemMat;
            this.mesh = needle;
            
            let dialOptions = {radius: needleLength * 1.25, arc: 0.5}
            const dial = BABYLON.MeshBuilder.CreateDisc("d", dialOptions , scene);
            dial.position.z = 0.2;
              
            // Animation
            let that = this;
            let t = 0.0;                    // temps écoulé entre deux périodes de latence
            let k = 0.0;                    // mesure du temps en ms
            let latency = 1000;             // latence pour passer d'une valeur mesurée à la suivante, en ms
            let invLatency = 1.0 / latency; // inverse de la latence
            let prevT = Date.now();         // date précédente
            let curT = prevT;               // date courante
            scene.registerBeforeRender(function () {


                // scaling du Ribbon en fonction de la mesure
                let ifaceMetric;
                for (let i in interfaceMetrics) {
                    ifaceMetric = interfaceMetrics[i];
                    break;  // récupération de la première interface uniquement
                }
                let m = ifaceMetric.metrics;
                let mIn = 0.0;
                let percentIn = 0.0;
                if (m) {
                    // reset eventuel de t
                    if (t > latency) {
                        that.reached = true;
                        t = 0.0;
                    }
                    if (!that.reached) {
                        t += engine.getDeltaTime();
                        ifaceMetric.updateMetricsLerp(t * invLatency);
                        let lerp = ifaceMetric.metricsLerp;
                        mIn = lerp.rateIn;
                        percentIn = mIn * 10.0;
                        needle.rotation.z = Math.PI * (1.0 - percentIn);
                    }
                }

                if (renderer.updatedMetrics) {
                    renderer.updatedMetrics = false;
                    that.reached = false;
                }
                curT = Date.now();
                let deltaT = (curT - prevT);
                k += deltaT;
                prevT = curT;  
            });

            return scene;

        }
    }
}
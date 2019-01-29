var BW3D;
(function (BW3D) {
    class Gauge {
        constructor(renderer) {
            this.tickDuration = 12000;
            this.reached = false;
            this.renderer = renderer;
            this.monitor = renderer.monitor;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            this.interfaceMetrics = renderer.interfaceMetrics;
            this.scene = this.createScene();
        }
        createScene() {
            const monitor = this.monitor;
            const renderer = this.renderer;
            const canvas = this.canvas;
            const engine = this.engine;
            const devices = this.devices;
            const interfaceMetrics = this.interfaceMetrics;
            const logarize = renderer.logarize;
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
            const needle = BABYLON.MeshBuilder.CreateBox("b", { width: needleLength, height: 0.1, depth: 0.1 }, scene);
            needle.setPivotPoint(new BABYLON.Vector3(-needleLength * 0.5, 0, 0));
            needle.setPositionWithLocalVector(new BABYLON.Vector3(needleLength * 0.5, 0, 0));
            needle.computeWorldMatrix(true);
            needle.material = needlemMat;
            this.mesh = needle;
            const dial = BABYLON.MeshBuilder.CreateDisc("d", { radius: needleLength * 1.25, arc: 0.5 }, scene);
            dial.position.z = 0.2;
            // Animation
            let that = this;
            let t = 0.0; // temps écoulé entre deux périodes de latence
            let k = 0.0; // mesure du temps en ms
            let latency = 1000; // latence pour passer d'une valeur mesurée à la suivante, en ms
            let invLatency = 1.0 / latency; // inverse de la latence
            let prevT = Date.now(); // date précédente
            let curT = prevT; // date courante
            scene.registerBeforeRender(function () {
                // scaling du Ribbon en fonction de la mesure
                let ifaceMetric;
                for (let i in interfaceMetrics) {
                    ifaceMetric = interfaceMetrics[i];
                    break; // récupération de la première interface uniquement
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
                        //lgIn = logarize(percentIn, amplification, minScale);  
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
    BW3D.Gauge = Gauge;
})(BW3D || (BW3D = {}));
//# sourceMappingURL=bw3d.gauge.js.map
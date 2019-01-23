module BW3D {

    export class Boxes {
        public scene: BABYLON.Scene;
        public renderer: Renderer;
        public monitor: Monitor;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public devices: {};
        public interfaceMetrics: {}
        public ifaces3d: {};
        public tickDuration: number = 12000;

        constructor(renderer: Renderer) {
            this.renderer = renderer;
            this.monitor = renderer.monitor;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            this.interfaceMetrics = renderer.interfaceMetrics;
            this.ifaces3d = {};                 // tableau associatif ifaces3d["deviceName@ifaceName"] = particleIdx idx de la particle IN, la particle OUT sera à pIdx + nb

            this.scene = this.createScene();
        }

        public createScene(): BABYLON.Scene {
            const monitor = this.monitor;
            const renderer = this.renderer;
            const canvas = this.canvas;
            const engine = this.engine;
            const devices = this.devices;
            const interfaceMetrics = this.interfaceMetrics;
            const ifaces3d = this.ifaces3d;
            const logarize = renderer.logarize;
            const delay = this.tickDuration;

            // Scene
            const scene = new BABYLON.Scene(engine);
            const camera = new BABYLON.ArcRotateCamera("cam", -Math.PI * 0.5, Math.PI * 0.5, 0.0, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
            const pl = new BABYLON.PointLight("pl", camera.position, scene);
            pl.specular = BABYLON.Color3.Gray();
            const gl = new BABYLON.GlowLayer('glow', scene);
            gl.intensity = 0.75;

            // Material
            const mat = new BABYLON.StandardMaterial("m", scene);

            // Creation du SPS pour le rendu des métriques des interfaces
            const sps = new BABYLON.SolidParticleSystem("sps", scene);
            const box = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
            let nb = 0;
            for (let d in devices) {
                let dev = devices[d];
                let ifaces = dev.interfaces;
                for (let i in ifaces) {
                    ifaces[i].sps = sps;
                    nb++;
                }
            }
            sps.addShape(box, nb * 2);      // x2 : un IN et un OUT par interface
            box.dispose();
            sps.buildMesh();
            sps.computeParticleTexture = false;
            //sps.computeParticleRotation = false;
            sps.isAlwaysVisible = true;
            
            sps.mesh.material = mat;
            mat.emissiveColor = BABYLON.Color3.Gray();
            mat.specularPower = 1000.0;

            // Placement des boxes
            const hSlotNb = 24;
            const vSlotNb = monitor.deviceNumber * 4; 
            const hMaxAngle = Math.PI;              // ouverture max horizontale
            const vMaxAngle = Math.PI * 0.5;              // ouverture max verticale
            const hSlotStep = hMaxAngle / hSlotNb;
            const vSlotStep = vMaxAngle / vSlotNb;
            const devNb = monitor.deviceNumber;
            let radius = 20.0;
            let p = 0;                      // index de particule

            let devCt = 0;                  // compteur de devices
            for (let d in devices) {
                let dev = devices[d];
                let ifaces = dev.interfaces;
                let ifNb = dev.interfaceNumber;
                let ifCt = 0;               // compteur d'interfaces
                let vMinAng = -devNb * vSlotStep * 0.5;
                let hMinAng = -ifNb * hSlotStep * 0.5;
                let beta = vMinAng + vSlotStep * devCt
                let y = radius * Math.sin(beta);
                for (let i in ifaces) {
                    let iface = ifaces[i];
                    iface.sps = sps;
                    let sname = d + "@" + i;
                    let sIn = sps.particles[p];
                    let sOut = sps.particles[p + nb];
                    let alpha = hMinAng + hSlotStep * ifCt;
                    let x = radius * Math.sin(alpha) * Math.cos(beta);
                    let z = radius * Math.cos(alpha) * Math.cos(beta);
                    sIn.position.copyFromFloats(x - 0.5, y, z);
                    sIn.color.copyFromFloats(0.0, 1.0, 0.0, 1.0);
                    sOut.position.copyFromFloats(x + 0.5, y , z);
                    sOut.color.copyFromFloats(1.0, 0.0, 0.0, 1.0);
                    sIn.rotation.y = alpha;
                    sOut.rotation.y = alpha;
                    sIn.rotation.x = beta;
                    sOut.rotation.x = beta;

                    ifaces3d[sname] = p;
                    p++;
                    ifCt++;
                }
                devCt++;
            };
            sps.setParticles();
            sps.refreshVisibleSize();
            //sps.mesh.freezeWorldMatrix();

            // Animation
            let t = 0.0;                    // temps écoulé entre deux périodes de latence
            let k = 0.0;                    // mesure du temps en ms
            let latency = 600;             // latence pour passer d'une valeur mesurée à la suivante, en ms
            let invLatency = 1.0 / latency; // inverse de la latence
            let prevT = Date.now();         // date précédente
            let curT = prevT;               // date courante
            let minScale = 0.1;             // valeur min du scaling des particules

            scene.onBeforeRenderObservable.add(function() {
                // reset eventuel de t
                t += engine.getDeltaTime();
                if (t > latency) {
                    t = 0.0;
                }

                let counter = 0;                            // compteur de particule
                for (let i in interfaceMetrics) {
                    let ifaceMetric = interfaceMetrics[i];
                    let p = ifaces3d[i];                    // index de la particule dans le SPS
                    let iface3dIn = sps.particles[p];       // particule In
                    let iface3dOut = sps.particles[p + nb]; // particule Out
                    let lgIn = 0.0;                         // pourcentage IN logarisé
                    let lgOut = 0.0;                        // pourcentage OUT logarisé
                    let mIn = 0.0;                          // mesure brute IN
                    let mOut = 0.0;                         // mesure brute OUT
                    let m = ifaceMetric.metrics;
                    let logs = ifaceMetric.metricsLog;
                    let lastMetric = logs[logs.length - 2];
                    let percentIn = 0.0;                    // pourcentage de la mesure IN
                    let percentOut = 0.0;                   // pourcentage de la mesure OUT
                    let amplification = 1000.0;
                    
                    if (m && lastMetric) {
                        ifaceMetric.updateMetricsLerp(t * invLatency);
                        let lerp = ifaceMetric.metricsLerp;

                        // scaling des particules
                        mIn = lerp.rateIn;
                        mOut = lerp.rateOut;
                        percentIn = mIn * 1000.0;
                        percentOut = mOut * 1000.0;
                        lgIn = logarize(percentIn, amplification, minScale);
                        lgOut = logarize(percentOut, amplification, minScale);
                        
                        iface3dIn.scaling.y = lgIn;
                        iface3dOut.scaling.y = lgOut;

                        // coloration du texte des interfaces
                        /*
                        if (renderer.ticked) {
                            let iface = interfaceMetrics[i];
                            let textIn = iface.guiIN;
                            let textOut = iface.guiOUT;
                            textIn.color = rgbString(mIn);
                            textOut.color = rgbString(mOut);
                            textIn.text = renderer.formatFixed(percentIn, 1);
                            textOut.text = renderer.formatFixed(percentOut, 1);
                        }
                        */
                    }
                    counter++;
                }

                sps.setParticles();
                curT = Date.now();
                let deltaT = (curT - prevT);
                k += deltaT;
                prevT = curT;  
                renderer.ticked = false;
            });
            return scene;
        }
    }
}
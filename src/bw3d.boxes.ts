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

        // Crée le ribbon portant les informations du device
        public createGUI(device: Device, paths: BABYLON.Vector3[][]): void {
            const scene = this.scene;
            let ribbon = BABYLON.MeshBuilder.CreateRibbon("r" + device.name, {pathArray: paths}, scene);
            device.mesh = ribbon;
            let advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(ribbon, 4096, 256, false); 
            let panel = new BABYLON.GUI.StackPanel();
            advancedTexture.addControl(panel);
            let textDeviceName = new BABYLON.GUI.TextBlock();
            textDeviceName.height = "256px";
            textDeviceName.fontSize = 250;
            textDeviceName.text = device.displayName;
            textDeviceName.color = "white";
            textDeviceName.outlineWidth = 8;
            textDeviceName.outlineColor = "black";
            panel.addControl(textDeviceName);

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
            scene.clearColor = new BABYLON.Color4(0.15, 0.2, 0.65);
            const camera = new BABYLON.ArcRotateCamera("cam", -Math.PI * 0.5, Math.PI * 0.5, 5.0, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
            camera.wheelPrecision = 80;
            camera.minZ = 0.001;

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
            let radiusGUI = radius * 1.0;
            let angleShift = Math.atan(0.5 / radius);       // angle de décalage de chaque box (droite/gauche) sur alpha
            let betaShift = Math.atan(0.5 / radiusGUI);     // angle de décalage des points up/down du ribbon
            let p = 0;                      // index de particule

            let devCt = 0;                  // compteur de devices
            for (let d in devices) {
                let dev = devices[d];
                let ifaces = dev.interfaces;
                let ifNb = dev.interfaceNumber;
                let ifCt = 0;               // compteur d'interfaces
                let vMinAng = devNb * vSlotStep * 0.5;
                let hMinAng = -ifNb * hSlotStep * 0.5;
                let beta = vMinAng + vSlotStep * devCt
                let betaU = beta - 3.0 * betaShift;
                let betaD = beta - betaShift;
                let y = radius * Math.sin(beta);
                let yU = radiusGUI * Math.sin(betaU);
                let yD = radiusGUI* Math.sin(betaD);

                let pathUP = [];
                let pathDown = [];
                let paths = [];

                for (let i in ifaces) {
                    let iface = ifaces[i];
                    iface.sps = sps;
                    let sname = d + "@" + i;
                    let sIn = sps.particles[p];
                    let sOut = sps.particles[p + nb];
                    
                    // positionnement des boites
                    let alpha = hMinAng + hSlotStep * ifCt;
                    let alphaIn = alpha - angleShift;
                    let alphaOut = alpha + angleShift;
                    let xIn = radius * Math.sin(alphaIn) * Math.cos(beta);
                    let xOut = radius * Math.sin(alphaOut) * Math.cos(beta);
                    let zIn = radius * Math.cos(alphaIn) * Math.cos(beta);
                    let zOut = radius * Math.cos(alphaOut) * Math.cos(beta);
                    sIn.position.copyFromFloats(xIn, y, zIn);
                    sIn.color.copyFromFloats(0.0, 1.0, 0.0, 1.0);
                    sOut.position.copyFromFloats(xOut, y , zOut);
                    sOut.color.copyFromFloats(1.0, 0.0, 0.0, 1.0);
                    sIn.rotation.y = alphaIn;
                    sOut.rotation.y = alphaOut;
                    sIn.rotation.x = -beta;
                    sOut.rotation.x = -beta;

                    // construction de la geometrie du ribbon
                    let xU = radiusGUI * Math.sin(alpha) * Math.cos(betaU);
                    let zU = radiusGUI * Math.cos(alpha) * Math.cos(betaU);
                    let xD = radiusGUI * Math.sin(alpha) * Math.cos(betaD);
                    let zD = radiusGUI * Math.cos(alpha) * Math.cos(betaD);
                    let vU = new BABYLON.Vector3(xU, yU, zU);
                    let vD = new BABYLON.Vector3(xD, yD, zD)
                    pathUP.push(vU);
                    pathDown.push(vD);

                    ifaces3d[sname] = p;
                    p++;
                    ifCt++;
                }
                devCt++;
                paths.push(pathUP, pathDown);
                this.createGUI(dev, paths);
            };
            sps.setParticles();
            sps.refreshVisibleSize();
            sps.computeParticleRotation = false;
            sps.mesh.freezeWorldMatrix();
            // Creation d'une icosphere de repérage
            const ico = BABYLON.MeshBuilder.CreateIcoSphere("ico", {radius: radius * 1.5, subdivisions: 6, sideOrientation: BABYLON.Mesh.BACKSIDE}, scene);
            const icoMat = new BABYLON.StandardMaterial("im", scene);
            icoMat.wireframe = true;
            icoMat.alpha = 0.2;
            ico.material = icoMat;
            ico.freezeWorldMatrix();
            ico.alwaysSelectAsActiveMesh = true;
            const ground = BABYLON.MeshBuilder.CreateDisc("disc", {radius: radius * 0.25, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
            ground.rotation.x = Math.PI * 0.5;    
            ground.position.y = -radius * 0.25;
            const groundMat = new BABYLON.StandardMaterial("gm", scene);
            groundMat.alpha = 0.5;
            groundMat.emissiveColor = BABYLON.Color3.Blue();
            ground.material = groundMat;
            ground.freezeWorldMatrix();
            ground.alwaysSelectAsActiveMesh = true;
            gl.addExcludedMesh(ico);
            gl.addExcludedMesh(ground);

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
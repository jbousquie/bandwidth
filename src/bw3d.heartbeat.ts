module BW3D {

    export class HeartBeat {
        public scene: BABYLON.Scene;
        public renderer: Renderer;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public devices: {};
        public interfaceMetrics: {}
        public ifaces3d: {};
        public ifaceMetrics: {};
        public tickDuration: number = 500;

        constructor(renderer: Renderer) {
            this.renderer = renderer;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            this.interfaceMetrics = renderer.interfaceMetrics;
            this.ifaces3d = {};                 // tableau associatif ifaces3d["deviceName@ifaceName"] = particleIdx idx de la particle IN, la particle OUT sera à pIdx + nb

            this.scene = this.createScene();
        };

        // retourne une valeur de scaling sous forme de pulsation en fonction du temps
        public beatScale(time: number, shift: number, scaling: number, minScaling: number, sign: number): number {
            let k = time * 0.01;
            let val = ( Math.cos(k + shift * sign) + 2. * Math.abs( Math.sin(k * 0.5 + shift * sign))) * scaling * 0.1 + scaling * 0.1 + minScaling;
            if (val < minScaling) {
                val = minScaling;
            }
            return val;
        };
        // retourne un log base 10 positif pour réduire visuellement l'amplitude de la variation 0 à 100
        public logarize(val: number, factor: number): number {
            let log = Math.log10(val * 10000.0 + 1.0) * factor;
            return log;
        }
        // retourne le maximum de deux valeurs
        public maximum(val1 : number, val2: number): number {
            let max = (val2 > val1) ? val2 : val1;
            return max;
        }

        // crée tous les panneaux et textures du GUI
        public createGUI(): void {
            const devices = this.devices;
            for (let name  in  devices) {
                let dev = devices[name];
                let g = dev.guiMesh;
                let mesh = dev.mesh;
                let xPixels = Math.ceil(mesh.scaling.x * 256);
                let advandedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(g, xPixels, 768, false);            // texture : device + metrics
                let advandedTextureIface = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(dev.mesh, xPixels, 768, false);// texture : interfaces
                advandedTextureIface.background = "white";
                let mat = dev.mesh.material;
                mat.diffuseColor.copyFromFloats(1.0, 1.0, 1.0);
                mat.diffuseTexture = mat.emissiveTexture;               // https://forum.babylonjs.com/t/gui-advanced-dynamic-texture-not-transparent/784/4?u=jerome
                mat.emissiveTexture = null;                 
                mat.opacityTexture = null;
                mat.backFaceCulling = true;
                // nom du device
                let panelGlobal = new BABYLON.GUI.StackPanel();         // panel global = nom device + panel mesures, texture du guiPlane
                advandedTexture.addControl(panelGlobal);
                let textDeviceName = new BABYLON.GUI.TextBlock();
                textDeviceName.height = "512px";
                textDeviceName.fontSize = 250;
                textDeviceName.text = dev.displayName;
                textDeviceName.color = "white";
                textDeviceName.outlineWidth = 8;
                textDeviceName.outlineColor = "black";
                panelGlobal.addControl(textDeviceName);
                // nom des interfaces et valeur des métriques
                let panelIfaces = new BABYLON.GUI.StackPanel();       // panel des noms d'interface servant de texture au mesh device  
                advandedTextureIface.addControl(panelIfaces);           
                let panelIfaceNames = new BABYLON.GUI.StackPanel();
                panelIfaceNames.isVertical = false;
                let panelMetrics = new BABYLON.GUI.StackPanel();      // panel des mesures
                panelMetrics.isVertical = false;

                let ifaces = dev.interfaces;
                for (let n in ifaces) {
                    let iface = ifaces[n];
                    let textIfaceName = new BABYLON.GUI.TextBlock();
                    let textMetrics = new BABYLON.GUI.TextBlock();
                    let w = Math.ceil(xPixels / dev.interfaceNumber);
                    textIfaceName.width = String(w) + "px";                 
                    textIfaceName.fontSize = 120;
                    textMetrics.width = textIfaceName.width;
                    textMetrics.height = "768px";
                    textMetrics.fontSize = 100;

                    let index = n.lastIndexOf("/");           // transformation du nom d'interface de "Gi1/0/1" en "1"
                    let lib = n;
                    if (index != -1) {
                        lib = n.substr(index + 1);
                    }
                    textIfaceName.text = lib;
                    textIfaceName.color = "blue";
                    textIfaceName.outlineWidth = 6;
                    textIfaceName.outlineColor = "black";
                    textMetrics.text = "00.0";
                    textMetrics.color = "white";
                    textMetrics.outlineWidth = 6;
                    textMetrics.outlineColor = "black";

                    panelIfaceNames.addControl(textIfaceName);
                    panelMetrics.addControl(textMetrics);

                    iface.gui = textMetrics;
                }
                panelIfaceNames.height = "512px";
                panelMetrics.height = "256px";
                panelIfaces.addControl(panelIfaceNames);
                panelGlobal.addControl(panelMetrics);
            } 
        };

        public createScene(): BABYLON.Scene {
            const renderer = this.renderer;
            const devices = this.devices;
            const canvas = this.canvas;
            const engine = this.engine;
            const ifaces3d = this.ifaces3d;
            const interfaceMetrics = this.interfaceMetrics;
            const beatScale = this.beatScale;
            const logarize = this.logarize;
            const maximum = this.maximum;

            // démarrage du ticker
            renderer.startTicker(this.tickDuration);

            // scene
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.4, 0.5, 1.0, 1.0);

            // camera et lumière  
            const helper = scene.createDefaultEnvironment({createSkybox: false});
            const camera = new BABYLON.ArcRotateCamera("cam", -Math.PI * 0.5, Math.PI * 0.5, 20, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
            const pl = new BABYLON.PointLight("pl", camera.position, scene);

            // Creation du SPS pour le rendu des métriques des interfaces
            const sps = new BABYLON.SolidParticleSystem("sps", scene);
            const radius = 0.4;
            const ico = BABYLON.MeshBuilder.CreateIcoSphere("ico", {radius: radius, subdivisions: 3}, scene);
            let nb = 0;
            for (let d in devices) {
                let dev = devices[d];
                let ifaces = dev.interfaces;
                for (let i in ifaces) {
                    ifaces[i].sps = sps;
                    nb++;
                }
            }
            sps.addShape(ico, nb * 2);      // x2 : un IN et un OUT par interface
            ico.dispose();
            sps.buildMesh();
            sps.computeParticleTexture = false;
            sps.computeParticleRotation = false;
            sps.isAlwaysVisible = true;
            sps.mesh.freezeWorldMatrix();

            // Placement des devices et des interfaces
            let p = 0;
            let minY = 0;
            const faceUV = [];
            faceUV[0] = faceUV[2] = faceUV[3] = faceUV[4] = faceUV[5] = BABYLON.Vector4.Zero();
            for (let d in devices) {
                let dev = devices[d];
                let b = BABYLON.MeshBuilder.CreateBox("box-" + d, {faceUV: faceUV}, scene);
                let gp = BABYLON.MeshBuilder.CreatePlane(d, {}, scene);     // le nom du mesh guiPlane est identique à celui de l'objet device
                if (dev.position) {
                    b.position.copyFromFloats(dev.position[0], dev.position[1], dev.position[2]);
                    gp.parent = b;
                    dev.mesh = b;
                    dev.guiMesh = gp;
                }
                else {
                    // faire un traitement de placement automatique
                }
                if (b.position.y < minY) {
                    minY = b.position.y;
                }

                let ifaces = dev.interfaces;
                let size = Object.keys(ifaces).length;
                let halfSize = size * 0.5;
                b.scaling.x = size;
                gp.position.z = -0.6;
                gp.position.y = 1.5;
                gp.scaling.y = 2.0;
                b.freezeWorldMatrix();
                gp.freezeWorldMatrix();

                let count = 0;                  // compteur d'interfaces
                for (let i in ifaces) {
                    let iface = ifaces[i];
                    iface.sps = sps;
                    iface.guiMesh = gp;
                    let sname = d + "@" + i;
                    let sIn = sps.particles[p];
                    let sOut = sps.particles[p + nb];
                    
                    sIn.position.copyFrom(b.position);
                    sIn.position.x += count - halfSize + radius;
                    sIn.position.y += 0.3;
                    sIn.position.z -= 0.7;
                    sIn.color.copyFromFloats(0.4, 1.0, 0.5, 1.0);
                    
                    sOut.position.copyFrom(sIn.position);
                    sOut.position.y -= 0.6;
                    sOut.color.copyFromFloats(1.0, 0.5, 0.4, 1.0);
                    
                    count++;

                    ifaces3d[sname] = p;
                    p++;
                }
            }

            // placement du ground
            helper.ground.position.y = minY - 10.0;
            helper.ground.freezeWorldMatrix();
            

            // GUI : textes des devices et interfaces et valeurs des mesures
            this.createGUI();
            

            // Animation
            var t = 0.0;                    // temps écoulé entre deux périodes de latence
            var latency = 1000;             // latence pour passer d'une valeur mesurée à la suivante, en ms
            var k = 0.0;                    // mesure du temps en ms
            let invLatency = 1.0 / latency; // inverse de la latence
            var prevT = Date.now();         // date précédente
            var curT = prevT;               // date courante
            var minScale = 0.1;             // valeur min du scaling des particules

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
                    
                    if (m && lastMetric) {
                        ifaceMetric.updateMetricsLerp(t * invLatency);
                        let lerp = ifaceMetric.metricsLerp;

                        // scaling des particules
                        mIn = lerp.rateIn;
                        mOut = lerp.rateOut;
                        percentIn = mIn * 100.0;
                        percentOut = mOut * 100.0;
                        lgIn = logarize(percentIn, minScale);
                        lgOut = logarize(percentOut, minScale);
                         
                        let sclIn = beatScale(k, counter, lgIn, minScale, 1.0);
                        let sclOut = beatScale(k, counter, lgOut, minScale, -1.0);

                        iface3dIn.scaling.copyFromFloats(sclIn, sclIn, sclIn);
                        iface3dOut.scaling.copyFromFloats(sclOut, sclOut, sclOut);

                        // coloration du texte des interfaces
                        if (renderer.ticked) {
                            let max = maximum(mIn, mOut);
                            let percentMax = maximum(percentIn, percentOut);
                            let rgbString: string;
                            if (max == 0) {
                                rgbString = "rgb(0, 0, 0)";         // texte noir si zero trafic
                            }
                            else {
                                let level = 255 - Math.floor(255.0 * max);
                                rgbString = "rgb(255, " + level + ", " + level + ")";
                            }
                            let iface = interfaceMetrics[i];
                            let text = iface.gui;
                            text.color = rgbString;
                            let fixed = percentMax.toFixed(1);     // formattage numérique 00.0
                            if (fixed.length  < 4 ) {
                                fixed = "0" + fixed;
                            }
                            text.text = fixed;
                        }
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
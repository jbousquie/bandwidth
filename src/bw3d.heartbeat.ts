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

        constructor(renderer: Renderer) {
            this.renderer = renderer;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            this.interfaceMetrics = renderer.interfaceMetrics;
            this.ifaces3d = {};                 // tableau associatif ifaces3d["deviceName@ifaceName"] = particleIdx idx de la particle IN, la particle OUT sera à pIdx + nb

            const devices = this.devices;
            const canvas = this.canvas;
            const engine = this.engine;
            const ifaces3d = this.ifaces3d;
            const interfaceMetrics = this.interfaceMetrics;

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
            for (let d in devices) {
                let dev = devices[d];
                let b = BABYLON.MeshBuilder.CreateBox("box-" + d, {}, scene);
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
            

            // GUI : textes des devices et interfaces
            for (let name  in  devices) {
                let dev = devices[name];
                let g = dev.guiMesh;
                let mesh = dev.mesh;
                let xPixels = Math.ceil(mesh.scaling.x * 256);
                let advandedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(g, xPixels, 768);
                // nom du device
                let panelGlobal = new BABYLON.GUI.StackPanel();
                advandedTexture.addControl(panelGlobal);
                let textDeviceName = new BABYLON.GUI.TextBlock();
                textDeviceName.height = "512px";
                textDeviceName.fontSize = 250;
                textDeviceName.text = dev.displayName;
                textDeviceName.color = "white";
                textDeviceName.outlineWidth = 8;
                textDeviceName.outlineColor = "black";
                panelGlobal.addControl(textDeviceName);
                // nom des interfaces
                let ifaces = dev.interfaces;
                let panelIfaceNames = new BABYLON.GUI.StackPanel();
                panelIfaceNames.isVertical = false;
                for (let n in ifaces) {
                    let iface = ifaces[n];
                    let textIfaceName = new BABYLON.GUI.TextBlock();
                    let w = Math.ceil(xPixels / dev.interfaceNumber);
                    textIfaceName.width = String(w) + "px";                 
                    textIfaceName.fontSize = 100;
                    let index = n.lastIndexOf("/");
                    let lib = n;
                    if (index != -1) {
                        lib = n.substr(index + 1);
                    }
                    textIfaceName.text = lib;
                    textIfaceName.color = "rgb(255, 255, 255)";
                    panelIfaceNames.addControl(textIfaceName);
                    textIfaceName.outlineWidth = 8;
                    textIfaceName.outlineColor = "black";
                    iface.gui = textIfaceName;
                }
                panelIfaceNames.height = "256px";
                panelGlobal.addControl(panelIfaceNames);

            }
            

            // animation
            var t = 0.0;
            var latency = 1000;
            var k = 0.0;
            let invLatency = 1.0 / latency;
            var prevT = Date.now();
            var curT = prevT;
            var minScale = 0.1;

            scene.onBeforeRenderObservable.add(function() {

                t += engine.getDeltaTime();
                if (t > latency) {
                    t = 0.0;
                }

                let counter = 0;
                let updatedMetrics = renderer.updatedMetrics;
                for (let i in interfaceMetrics) {
                    let ifaceMetric = interfaceMetrics[i];
                    let p = ifaces3d[i];                    // index de la particule
                    let iface3dIn = sps.particles[p];       // particule In
                    let iface3dOut = sps.particles[p + nb]; // particule Out
                    let sIn = 0.05;
                    let sOut = sIn;
                    let mIn = 0.0;
                    let mOut = 0.0;
                    let m = ifaceMetric.metrics;
                    let logs = ifaceMetric.metricsLog;
                    let lastMetric = logs[logs.length - 2];
                    let percentIn = 0.0;
                    let percentOut = 0.0;
                    
                    // scaling des particules
                    if (m && lastMetric) {
                        ifaceMetric.updateMetricsLerp(t * invLatency);
                        let lerp = ifaceMetric.metricsLerp;

                        mIn = lerp.rateIn;
                        mOut = lerp.rateOut;
                        percentIn = mIn * 100.0;
                        percentOut = mOut * 100.0;
                        sIn = Math.log10(percentIn * 1000.0 + 1.0) * 0.2;
                        sOut = Math.log10(percentOut * 1000.0 + 1.0) * 0.2;
                    }     

                    let sclIn = ( Math.cos(k + counter) + 2. * Math.abs( Math.sin(k * 0.5 + counter))) * 0.1 + sIn * 0.2 + minScale;
                    let sclOut = ( Math.cos(k - counter) + 2. * Math.abs( Math.sin(k * 0.5 - counter))) * 0.1 + sOut * 0.2 + minScale;
                    
                    if (sclIn < minScale) {
                        sclIn = minScale;
                    }
                    if (sclOut < minScale) {
                        sclOut = minScale;
                    }
                    
                    iface3dIn.scaling.copyFromFloats(sclIn, sclIn, sclIn);
                    iface3dOut.scaling.copyFromFloats(sclOut, sclOut, sclOut);

                    // coloration du texte des interfaces
                    if (updatedMetrics && m) {
                        let max = (mIn > mOut) ? mIn : mOut;
                        let rgbString: string;
                        if (max == 0) {
                            rgbString = "rgb(0, 0, 0)";
                        }
                        else {
                            let level = 255 - Math.floor(255.0 * max);
                            rgbString = "rgb(255, " + level + ", " + level + ")";
                        }
                        let iface = interfaceMetrics[i];
                        let text = iface.gui;
                        text.color = rgbString;
                        renderer.updatedMetrics = false;
                    }
                    counter++;
                }
                sps.setParticles();
                curT = Date.now();
                let deltaT = (curT - prevT) * 0.01;
                k += deltaT;
                prevT = curT;
                
            });

            this.scene = scene;
        }
    }
}
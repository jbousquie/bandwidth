var BW3D;
(function (BW3D) {
    // objet d'association Device logique/mesh
    class DeviceLogicalRender {
        constructor(device, mesh, gui) {
            this.device = device;
            this.mesh = mesh;
            this.gui = gui;
        }
    }
    BW3D.DeviceLogicalRender = DeviceLogicalRender;
    ;
    class HeartBeat {
        constructor(renderer) {
            this.renderer = renderer;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            this.interfaceMetrics = renderer.interfaceMetrics;
            this.ifaces3d = {}; // tableau associatif ifaces3d["deviceName@ifaceName"] = particleIdx idx de la particle IN, la particle OUT sera à pIdx + nb
            this.devicesLR = {}; // tableau associatif Logical/Render devicesLR[devName] = {device: devObj, mesh: BJS.Mesh, guiPlane: BJS.GUI}
            const devices = this.devices;
            const canvas = this.canvas;
            const engine = this.engine;
            const ifaces3d = this.ifaces3d;
            const interfaceMetrics = this.interfaceMetrics;
            const devicesLR = this.devicesLR;
            // scene
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.4, 0.5, 0.8);
            // camera et lumière
            const camera = new BABYLON.ArcRotateCamera("cam", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
            camera.setPosition(new BABYLON.Vector3(0, 0, -20));
            new BABYLON.PointLight("pl", camera.position, scene);
            // Creation du SPS pour le rendu des métriques des interfaces
            const sps = new BABYLON.SolidParticleSystem("sps", scene);
            const radius = 0.4;
            const ico = BABYLON.MeshBuilder.CreateIcoSphere("ico", { radius: radius, subdivisions: 3 }, scene);
            let nb = 0;
            for (let d in devices) {
                let dev = devices[d];
                let ifaces = dev.interfaces;
                for (let i in ifaces) {
                    nb++;
                }
            }
            sps.addShape(ico, nb * 2); // x2 : un IN et un OUT par interface
            ico.dispose();
            sps.buildMesh();
            sps.computeParticleTexture = false;
            sps.computeParticleRotation = false;
            sps.isAlwaysVisible = true;
            sps.mesh.freezeWorldMatrix();
            // Placement des devices et des interfaces
            let p = 0;
            for (let d in devices) {
                let dev = devices[d];
                let b = BABYLON.MeshBuilder.CreateBox("box-" + d, {}, scene);
                let gp = BABYLON.MeshBuilder.CreatePlane(d, {}, scene); // le nom du mesh guiPlane est identique à celui de l'objet device
                if (dev.position) {
                    b.position.copyFromFloats(dev.position[0], dev.position[1], dev.position[2]);
                    gp.parent = b;
                    devicesLR[d] = new DeviceLogicalRender(dev, b, gp);
                }
                else {
                    // faire un traitement de placement automatique
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
                let count = 0; // compteur d'interfaces
                for (let i in ifaces) {
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
            // GUI : textes des devices et interfaces
            for (let name in devicesLR) {
                let devLR = devicesLR[name];
                let g = devLR.gui;
                let dev = devLR.device;
                let xPixels = Math.ceil(devLR.mesh.scaling.x * 256);
                let advandedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(g, xPixels, 768);
                // nom du device
                let panelGlobal = new BABYLON.GUI.StackPanel();
                advandedTexture.addControl(panelGlobal);
                let textDeviceName = new BABYLON.GUI.TextBlock();
                //textDeviceName.resizeToFit = true;
                textDeviceName.height = "512px";
                textDeviceName.fontSize = 250;
                textDeviceName.text = dev.displayName;
                textDeviceName.color = "white";
                panelGlobal.addControl(textDeviceName);
                // nom des interfaces
                let ifaces = dev.interfaces;
                let panelIfaceNames = new BABYLON.GUI.StackPanel();
                panelIfaceNames.isVertical = false;
                for (let n in ifaces) {
                    let textIfaceName = new BABYLON.GUI.TextBlock();
                    //textIfaceName.resizeToFit = true;  
                    let w = Math.ceil(xPixels / dev.interfaceNumber);
                    textIfaceName.width = String(w) + "px";
                    textIfaceName.fontSize = 100;
                    let index = n.lastIndexOf("/");
                    let lib = n;
                    if (index != -1) {
                        lib = n.substr(index + 1);
                    }
                    textIfaceName.text = lib;
                    textIfaceName.color = "DarkBlue";
                    panelIfaceNames.addControl(textIfaceName);
                }
                panelIfaceNames.height = "256px";
                panelGlobal.addControl(panelIfaceNames);
            }
            // animation
            var k = 0.0;
            var prevT = Date.now();
            var curT = prevT;
            scene.onBeforeRenderObservable.add(function () {
                for (let i in interfaceMetrics) {
                    let iface = interfaceMetrics[i];
                    let p = ifaces3d[i];
                    let iface3dIn = sps.particles[p];
                    let iface3dOut = sps.particles[p + nb];
                    let sIn = 0.1;
                    let sOut = sIn;
                    if (renderer.updatedMetrics && iface.metrics) {
                        //renderer.updatedMetrics = false;
                        sIn = Math.log(iface.metrics.speedIn) * 0.1;
                        sOut = Math.log(iface.metrics.speedOut) * 0.1;
                    }
                    let sclIn = (0.1 + (Math.cos(k * sIn) + 2. * Math.abs(Math.sin(k * sIn * 0.5))) * 0.5) * sIn;
                    let sclOut = (0.1 + (Math.cos(k * sOut) + 2. * Math.abs(Math.sin(k * sOut * 0.5))) * 0.5) * sOut;
                    iface3dIn.scaling.copyFromFloats(sclIn, sclIn, sclIn);
                    iface3dOut.scaling.copyFromFloats(sclOut, sclOut, sclOut);
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
    BW3D.HeartBeat = HeartBeat;
})(BW3D || (BW3D = {}));
//# sourceMappingURL=bw3d.heartbeat.js.map
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
            this.ifaces3d = {};

            const devices = this.devices;
            const canvas = this.canvas;
            const engine = this.engine;
            const ifaces3d = this.ifaces3d;
            const interfaceMetrics = this.interfaceMetrics;


            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.4, 0.5, 0.8);

            const camera = new BABYLON.ArcRotateCamera("cam", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
            camera.setPosition(new BABYLON.Vector3(0, 0, -20));

            const pl = new BABYLON.PointLight("pl", camera.position, scene);

            // Creation du SPS pour le rendu des interfaces
            const sps = new BABYLON.SolidParticleSystem("sps", scene);
            const radius = 0.4;
            const ico = BABYLON.MeshBuilder.CreateIcoSphere("ico", {radius: radius, subdivisions: 3}, scene);
            let nb = 0;
            for (let d in devices) {
                let dev = devices[d];
                let ifaces = dev.interfaces;
                for (let i in ifaces) {
                    nb++;
                }
            }
            sps.addShape(ico, nb * 2);  // x2 : un IN et un OUT par interface
            sps.buildMesh();
            sps.computeParticleTexture = false;
            sps.computeParticleRotation = false;
            sps.isAlwaysVisible = true;
            ico.dispose();

            // Placement des devices et des interfaces
            let p = 0;
            for (let d in devices) {
                let dev = devices[d];
                let b = BABYLON.MeshBuilder.CreateBox(d, {}, scene);
                if (dev.position) {
                    b.position.copyFromFloats(dev.position[0], dev.position[1], dev.position[2]);
                }
                else {
                    // faire un traitement de placement automatique
                }
                let ifaces = dev.interfaces;
                let size = Object.keys(ifaces).length;
                let halfSize = size * 0.5;
                b.scaling.x = size;

                let count = 0;
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


            var k = 0.0;
            var prevT = Date.now();
            var curT = prevT;
            scene.onBeforeRenderObservable.add(function() {

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
                    let sclIn = (0.1 + ( Math.cos(k * sIn) + 2. * Math.abs( Math.sin(k * sIn * 0.5))) * 0.5) * sIn;
                    let sclOut = (0.1 + ( Math.cos(k * sOut) + 2. * Math.abs( Math.sin(k * sOut * 0.5))) * 0.5) * sOut;
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
}
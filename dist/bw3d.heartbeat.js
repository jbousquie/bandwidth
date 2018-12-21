var BW3D;
(function (BW3D) {
    class HeartBeat {
        constructor(renderer) {
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
            const metricsLimits = {};
            const metricsSlopes = {};
            const metricsCurrent = {};
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.4, 0.5, 0.8);
            const camera = new BABYLON.ArcRotateCamera("cam", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
            camera.setPosition(new BABYLON.Vector3(0, 0, -20));
            const pl = new BABYLON.PointLight("pl", camera.position, scene);
            // Placement des devices et des interfaces
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
                let radius = 0.4;
                let count = 0;
                for (let i in ifaces) {
                    let sname = d + "@" + i;
                    let s = BABYLON.MeshBuilder.CreateIcoSphere(sname, { radius: radius }, scene);
                    s.position.copyFrom(b.position);
                    s.position.z -= 0.7;
                    s.position.x += count - halfSize + radius;
                    count++;
                    ifaces3d[sname] = s;
                    metricsCurrent[sname] = 0;
                    metricsLimits[sname] = 0;
                    metricsSlopes[sname] = 0;
                }
            }
            scene.onBeforeRenderObservable.add(function () {
                for (let i in interfaceMetrics) {
                    let iface = interfaceMetrics[i];
                    let iface3d = ifaces3d[i];
                    if (renderer.updatedMetrics && iface.metrics) {
                        let oldLimit = metricsLimits[i] || 0;
                        renderer.updatedMetrics = false;
                        let speedIn = iface.metrics.speedIn;
                        metricsLimits[i] = speedIn;
                        metricsSlopes[i] = (speedIn - oldLimit) * 0.01;
                    }
                    metricsCurrent[i] += metricsSlopes[i];
                    if ((metricsCurrent[i] < metricsLimits[i] && metricsSlopes[i] > 0) || (metricsCurrent[i] > metricsLimits[i] && metricsSlopes[i] < 0)) {
                        iface3d.scaling.y = metricsCurrent[i] * 0.000001;
                    }
                }
            });
            this.scene = scene;
        }
    }
    BW3D.HeartBeat = HeartBeat;
})(BW3D || (BW3D = {}));
//# sourceMappingURL=bw3d.heartbeat.js.map
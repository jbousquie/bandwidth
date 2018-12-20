var BW3D;
(function (BW3D) {
    class HeartBeat {
        constructor(engine, canvas, devices) {
            this.devices = devices;
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.4, 0.5, 0.8);
            const camera = new BABYLON.ArcRotateCamera("cam", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
            console.table(devices);
            for (let d in devices) {
                let dev = devices[d];
                let b = BABYLON.MeshBuilder.CreateIcoSphere(d, {}, scene);
                if (dev.position) {
                    b.position.copyFromFloats(dev.position[0], dev.position[1], dev.position[2]);
                }
            }
            this.scene = scene;
        }
    }
    BW3D.HeartBeat = HeartBeat;
})(BW3D || (BW3D = {}));
//# sourceMappingURL=bw3d.heartbeat.js.map
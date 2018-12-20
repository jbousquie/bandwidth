module BW3D {
    export class HeartBeat {
        public scene: BABYLON.Scene;
        public devices: {};

        constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement, devices: {}) {
            this.devices = devices;
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.4, 0.5, 0.8);

            const camera = new BABYLON.ArcRotateCamera("cam", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
console.table(devices)
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
}
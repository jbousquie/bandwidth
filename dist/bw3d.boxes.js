var BW3D;
(function (BW3D) {
    class Boxes {
        constructor(renderer) {
            this.tickDuration = 12000;
            this.renderer = renderer;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            this.interfaceMetrics = renderer.interfaceMetrics;
            this.scene = this.createScene();
        }
        createScene() {
            const renderer = this.renderer;
            const canvas = this.canvas;
            const engine = this.engine;
            const interfaceMetrics = this.interfaceMetrics;
            const delay = this.tickDuration;
            const beatScale = renderer.beatScale;
            const logarize = renderer.logarize;
            // Scene
            const scene = new BABYLON.Scene(engine);
            return scene;
        }
    }
    BW3D.Boxes = Boxes;
})(BW3D || (BW3D = {}));
//# sourceMappingURL=bw3d.boxes.js.map
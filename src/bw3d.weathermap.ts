module BW3D {
    export class WeatherMap {
        public scene: BABYLON.Scene;
        public renderer: Renderer;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public devices: {};
        public interfaceMetrics: {}
        public ifaces3d: {};
        public tickDuration: number = 600;
        public reached = false;

        constructor(renderer: Renderer) {
            this.renderer = renderer;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            this.interfaceMetrics = renderer.interfaceMetrics;
            this.ifaces3d = {};                 // tableau associatif ifaces3d["deviceName@ifaceName"] = particleIdx idx de la particle IN, la particle OUT sera à pIdx + nb

            this.scene = this.createScene();
            
            // démarrage du ticker
            //renderer.startTicker(this.tickDuration);
        };

        // crée tous les panneaux et textures du GUI
        public createGUI(): void {
            const devices = this.devices;
            for (let name  in  devices) {
                let dev = devices[name];
                let g = dev.guiMesh;
                let mesh = dev.mesh;
                let xPixels = Math.ceil(mesh.scaling.x * 256);
                let advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(g, xPixels, 1024, false);            // texture : device name

                // nom du device
                let panelGlobal = new BABYLON.GUI.StackPanel();         // panel global = nom device, texture du guiPlane
                advancedTexture.addControl(panelGlobal);
                let textDeviceName = new BABYLON.GUI.TextBlock();
                textDeviceName.height = "512px";
                textDeviceName.fontSize = 320;
                textDeviceName.text = dev.displayName;
                textDeviceName.color = "white";
                textDeviceName.outlineWidth = 8;
                textDeviceName.outlineColor = "black";
                panelGlobal.addControl(textDeviceName);

                }

        };

        public createScene(): BABYLON.Scene {
            const renderer = this.renderer;
            const devices = this.devices;
            const canvas = this.canvas;
            const engine = this.engine;
            const ifaces3d = this.ifaces3d;
            const interfaceMetrics = this.interfaceMetrics;
            const beatScale = renderer.beatScale;
            const logarize = renderer.logarize;

            // scene
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.4, 0.5, 1.0, 1.0);

            // camera et lumière  
            const helper = scene.createDefaultEnvironment({createSkybox: false});
            const camera = new BABYLON.ArcRotateCamera("cam", -Math.PI * 0.5, Math.PI * 0.5, 20, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas);
            const pl = new BABYLON.PointLight("pl", camera.position, scene);

            // texture et materiel
            const textURL = "./images/switch.png";
            const swiText = new BABYLON.Texture(textURL, scene);
            const swiMat = new BABYLON.StandardMaterial("sm", scene);
            swiMat.diffuseTexture = swiText;

           // Placement des devices
           let p = 0;
           let minY = 0;
           const faceUV = [];
           faceUV[0] = faceUV[2] = faceUV[3] = faceUV[4] = faceUV[5] = BABYLON.Vector4.Zero();
           for (let d in devices) {
               let dev = devices[d];
               let b = BABYLON.MeshBuilder.CreateBox("box-" + d, {faceUV: faceUV}, scene);
               let gp = BABYLON.MeshBuilder.CreatePlane(d, {}, scene);     // le nom du mesh guiPlane est identique à celui de l'objet device
               b.material = swiMat;
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
               let size = dev.interfaceNumber;
               b.scaling.x = size;
               b.scaling.z = 2.5;
               gp.position.z = -0.6;
               gp.position.y = 1.0;
               gp.scaling.y = 1.5;
               b.freezeWorldMatrix();
               gp.freezeWorldMatrix();

               let count = 0;                  // compteur d'interfaces
               for (let i in ifaces) {
                   let iface = ifaces[i];

               }
           }
            // placement du ground
            helper.ground.position.y = minY - 10.0;
            helper.ground.freezeWorldMatrix();
            

            // GUI : textes des devices et interfaces et valeurs des mesures
            this.createGUI();

            return scene;
        }
    }
    
}
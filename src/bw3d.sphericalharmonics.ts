module BW3D {

    export class SphericalHarmonics {
        public scene: BABYLON.Scene;
        public renderer: Renderer;
        public engine: BABYLON.Engine;
        public canvas: HTMLCanvasElement;
        public devices: {};
        public interfaceMetrics: {}
        public paths: BABYLON.Vector3[][];
        public targetPaths: BABYLON.Vector3[][];
        public deltas: BABYLON.Vector3[];
        public colors: BABYLON.Color3[];
        public deltaColors: BABYLON.Color3[];
        public m: number[] = [1, 3, 1, 5, 1, 7, 1, 9];
        public lat: number = 50;
        public lng: number = 50;
        public steps: number;
        public tickDuration: number = 600;
        private _morphing: boolean = false;
        private _currentStep; number = 0;

        constructor(renderer: Renderer) {
            this.renderer = renderer;
            this.engine = renderer.engine;
            this.canvas = renderer.canvas;
            this.devices = renderer.devices;
            this.interfaceMetrics = renderer.interfaceMetrics;
            this.paths = [];
            this.targetPaths = [];
            this.deltas = [];
            this.colors = [
                new BABYLON.Color3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5),
                new BABYLON.Color3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5),
                new BABYLON.Color3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5),
                new BABYLON.Color3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5),
                new BABYLON.Color3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5),
                new BABYLON.Color3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5)
            ];
            this.deltaColors = [BABYLON.Color3.Black(), BABYLON.Color3.Black(), BABYLON.Color3.Black(), BABYLON.Color3.Black(), BABYLON.Color3.Black(), BABYLON.Color3.Black()];

            this.scene = this.createScene();
        };

        /**
         * Met à jour les paths selon la fonction harmonique
         */
        public computeHarmonics(paths: BABYLON.Vector3[][]): void {
            let m = this.m;
            let lat = this.lat;
            let long = this.lng;
            const pi = Math.PI;
            const pi2 = Math.PI * 2.0;
            const steplat = pi / lat;
            const steplon = pi2 / long;
            let mustPopulate: boolean = true;
            if (paths[0]) {
                mustPopulate = false;
            }
            let index = 0;
            for (let theta = 0; theta <= pi2; theta += steplon) {
                let idx = 0;
                let path = (mustPopulate) ? [] : paths[index];
                for (let phi = 0; phi <= pi; phi += steplat) {
                    let r = 0;
                    r += Math.pow(Math.sin(Math.floor(m[0]) * phi), Math.floor(m[1]));
                    r += Math.pow(Math.cos(Math.floor(m[2]) * phi), Math.floor(m[3]));
                    r += Math.pow(Math.sin(Math.floor(m[4]) * theta), Math.floor(m[5]));
                    r += Math.pow(Math.cos(Math.floor(m[6]) * theta), Math.floor(m[7]));
                    let p = (mustPopulate) ? BABYLON.Vector3.Zero() : path[idx];
                    p.copyFromFloats(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
                    path[idx] = p;
                    idx++;
                }
                paths[index] = path;
                index++;
            }
        };
 
        /**
         * Génère une nouvelle harmonique sphérique.
         * Met à jour les valeurs cibles, les couleurs cibles et les pas de progression pour atteindre cette nouvelle harmonique.
         */
        public generateHarmonics(): void {
            this._morphing = true;
            let scl = 1 / this.steps;

            // new harmonic
            let m = this.m;
            for (let i = 0; i < m.length; i++) {
                let rand = (Math.random() * 10)|0;
                m[i] = rand;
            }
            this.computeHarmonics(this.targetPaths);

            // deltas computation
            let paths = this.paths;
            let targetPaths = this.targetPaths;
            let deltas = this.deltas;
            let index = 0;
            for (let p = 0; p < targetPaths.length; p++) {
                let targetPath = targetPaths[p];
                let path = paths[p];
                for (let i = 0; i < targetPath.length; i++) {
                    deltas[index] = (targetPath[i].subtractInPlace(path[i])).scaleInPlace(scl);
                    index++;
                }
            }

            // delta colors
            let colors = this.colors;
            let deltaColors = this.deltaColors;
            for (let c = 0; c < colors.length; c++) {
                let col = colors[c];
                let r = (Math.random() * 0.5 - col.r) * scl; 
                let g = (Math.random() * 0.5 - col.g) * scl; 
                let b = (Math.random() * 0.5 - col.b) * scl; 
                deltaColors[c].copyFromFloats(r, g, b);
            }
        }

        /**
         * Transforme la géométrie et les couleurs du mesh
         */
        public morph(): void {
            if (this._currentStep === this.steps) {
                this._currentStep = 0;
                this._morphing = false;
                //this.paths = targetPaths;
            }
            else {
                // update paths
                let index = 0;
                let paths = this.paths;
                let deltas = this.deltas;
                for (let p = 0; p < paths.length; p++) {
                    let path = paths[p];
                    for (var i = 0; i < path.length; i++) {
                        path[i].addInPlace(deltas[index]);
                        index++;
                    }
                }
                BABYLON.Mesh.CreateRibbon(null, paths, null, null, null, scene, null, null, mesh);
                // update colors
                let colors = this.colors;
                let deltaColors = this.deltaColors;
                for (let c = 0; c < colors.length; c++) {
                    colors[c].addToRef(deltaColors[c], colors[c]);
                }
            }
            this._currentStep++;
        }

        public createScene(): BABYLON.Scene {
            const renderer = this.renderer;
            const devices = this.devices;
            const canvas = this.canvas;
            const engine = this.engine;
            const interfaceMetrics = this.interfaceMetrics;
            const delay = this.tickDuration;
            const paths = this.paths;
            const targetPaths = this.targetPaths;
            const m = this.m;
            const deltas = this.deltas;
            const colors = this.colors;
            const deltaColors = this.deltaColors;

            this.steps = Math.floor(delay / 80);
            
            var morph = false;
            var counter = 0;

            /*
            const beatScale = this.beatScale;
            const logarize = this.logarize;
            const rgbString = this.rgbString;
            */

            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0, 0, 0.2, 1.0);
            const camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2 - 0.5, 0.5, 6, BABYLON.Vector3.Zero(), scene);
            camera.wheelPrecision = 100;
            camera.attachControl(canvas, true);
        
            // procedural fire material
            const fireMaterial = new BABYLON.StandardMaterial("fireMaterial", scene);
            const fireTexture = new BABYLON.FireProceduralTexture("fire", 256, scene);
            fireTexture.level = 2;
            fireTexture.vScale = 0.5;
            fireMaterial.diffuseColor = new BABYLON.Color3(Math.random() / 2, Math.random() / 2, Math.random() / 2);
            fireMaterial.diffuseTexture = fireTexture;
            fireMaterial.alpha = 1;
            fireMaterial.specularTexture = fireTexture;
            fireMaterial.emissiveTexture = fireTexture;
            fireMaterial.specularPower = 4;
            fireMaterial.backFaceCulling = false;
            fireTexture.fireColors = this.colors;  
      
           // morphing function : update ribbons with intermediate m values
           var morphing = function (mesh, m, paths, targetPaths, deltas, deltaColors) {
               if (counter === this.steps) {
                   counter = 0;
                   morph = false;
                   paths = targetPaths;
               }
               else {
                   // update paths
                   var index = 0;
                   for (var p = 0; p < paths.length; p++) {
                       var path = paths[p];
                       for (var i = 0; i < path.length; i++) {
                           path[i] = path[i].add(deltas[index]);
                           index++;
                       }
                   }
                   mesh = BABYLON.Mesh.CreateRibbon(null, paths, null, null, null, scene, null, null, mesh);
                   // update colors
                   for (var c = 0; c < colors.length; c++) {
                       colors[c] = colors[c].add(deltaColors[c]);
                   }
               }
               counter++;
               return mesh;
           };
       
           // SH init & ribbon creation
           //harmonic(m, lat, lng, paths);
           this.computeHarmonics(paths);
           var mesh = BABYLON.Mesh.CreateRibbon("ribbon", paths, true, false, 0, scene, true);
           mesh.freezeNormals();
           mesh.scaling = new BABYLON.Vector3(1, 1, 1);
           mesh.material = fireMaterial;
           // Volumetric Light
           var volLight = new BABYLON.VolumetricLightScatteringPostProcess("vl", 1.0, camera, mesh, 50, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
           volLight.exposure = 0.15;
           volLight.decay = 0.95;
           volLight.weight = 0.5;
       
           // interval setting
           let that = this;
           var interval = window.setInterval(function () {
               that.generateHarmonics();
               mesh = morphing(mesh, m, paths, targetPaths, deltas, deltaColors);
           }, delay);
       
           // immediate first SH
           this.generateHarmonics();
       
           // then animation
           scene.registerBeforeRender(function () {
               if (morph) {
                   mesh = morphing(mesh, m, paths, targetPaths, deltas, deltaColors);
               }
               /*
               rx += deltarx;
               ry -= deltary;
               mesh.rotation.y = ry;
               mesh.rotation.z = rx;
               */
           });
       
           scene.onDispose = function () {
               clearInterval(interval);
           }
       
           return scene;  
        }
    }
}
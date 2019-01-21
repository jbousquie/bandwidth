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
        public lat: number = 80;
        public lng: number = 80;
        public steps: number = 20;
        public tickDuration: number = 12000;
        public mesh: BABYLON.Mesh;
        public ribbonOptions: any;
        private _morphing: boolean = false;
        private _currentStep: number = 0;

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
            
            // démarrage du ticker
            renderer.startTicker(this.tickDuration);
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
         * Génère une nouvelle harmonique sphérique cible.
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
        public morphRibbon(): void {
            if (this._currentStep === this.steps) {
                this._currentStep = 0;
                this._morphing = false;
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
                BABYLON.MeshBuilder.CreateRibbon(null, this.ribbonOptions);
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
            const canvas = this.canvas;
            const engine = this.engine;
            const interfaceMetrics = this.interfaceMetrics;
            const delay = this.tickDuration;
            const paths = this.paths;

            const beatScale = renderer.beatScale;
            const logarize = renderer.logarize;
    
            this.steps = Math.floor(delay / 40.0);

            // Scene
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0, 0, 0.2, 1.0);
            const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 0, BABYLON.Vector3.Zero(), scene);
            camera.setPosition(new BABYLON.Vector3(0, 0.5, -10.0));
            //camera.wheelPrecision = 100;
            camera.minZ = 0.1;
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
            fireTexture.fireColors = this.colors;  
            fireMaterial.backFaceCulling = false;
      
           // Calcul d'une premiere SH et création d'un ribbon sur cette géométrie
           this.computeHarmonics(paths);
           this.ribbonOptions = {pathArray: this.paths, closeArray: true, sideOrientation: BABYLON.Mesh.BACKSIDE, updatable: true};
           this.mesh = BABYLON.MeshBuilder.CreateRibbon("ribbon", this.ribbonOptions, scene);
           this.ribbonOptions.instance = this.mesh;
           this.mesh.freezeNormals();
           this.mesh.alwaysSelectAsActiveMesh = true;
           this.mesh.material = fireMaterial;

           // Volumetric Light
           const volLight = new BABYLON.VolumetricLightScatteringPostProcess("vl", 1.0, camera, this.mesh, 50, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
           volLight.exposure = 0.15;
           volLight.decay = 0.95;
           volLight.weight = 0.5;
              
            // Animation
            let that = this;
            let mesh = this.mesh;
            let t = 0.0;                    // temps écoulé entre deux périodes de latence
            let k = 0.0;                    // mesure du temps en ms
            let latency = 1000;             // latence pour passer d'une valeur mesurée à la suivante, en ms
            let invLatency = 1.0 / latency; // inverse de la latence
            let prevT = Date.now();         // date précédente
            let curT = prevT;               // date courante
            let minScale = 0.75;             // valeur min du scaling du mesh
            let amplification = 1000.0;

            scene.registerBeforeRender(function () {
                // reset eventuel de t
                t += engine.getDeltaTime();
                if (t > latency) {
                    t = 0.0;
                }
                if (that._morphing) {       // si morphing en cours non terminé
                    that.morphRibbon();
                }

                // scaling du Ribbon en fonction de la mesure
                let ifaceMetric;
                for (let i in interfaceMetrics) {
                    ifaceMetric = interfaceMetrics[i];
                    break;  // récupération de la première interface uniquement
                }
                let m = ifaceMetric.metrics;
                let mIn = 0.0;
                let percentIn = 0.0;
                let lgIn = 0.0;

                if (m) {
                    ifaceMetric.updateMetricsLerp(t * invLatency);
                    let lerp = ifaceMetric.metricsLerp;
                    mIn = lerp.rateIn;
                    percentIn = mIn * 10.0;
                    lgIn = logarize(percentIn, amplification, minScale);   
                    let kf = k * 0.02;
                    let sclIn = beatScale(kf, 0, lgIn, 0.1, minScale, 1.0);
                    let sinScl = sclIn * Math.sin(kf) * percentIn + sclIn
                    mesh.scaling.copyFromFloats(sinScl, sclIn, sinScl);
                }

                if (renderer.ticked) {      // si un tic s'est produit alors calcule nouvelle SH cible
                    that.generateHarmonics();
                    renderer.ticked = false;
                }

                curT = Date.now();
                let deltaT = (curT - prevT);
                k += deltaT;
                prevT = curT;  
                mesh.rotation.y += 0.005;
                mesh.rotation.z += 0.001;
            });
             
           return scene;  
        }
    }
}
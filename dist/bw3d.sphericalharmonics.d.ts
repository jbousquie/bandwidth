declare module BW3D {
    class SphericalHarmonics {
        scene: BABYLON.Scene;
        renderer: Renderer;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        devices: {};
        interfaceMetrics: {};
        paths: BABYLON.Vector3[][];
        targetPaths: BABYLON.Vector3[][];
        deltas: BABYLON.Vector3[];
        colors: BABYLON.Color3[];
        deltaColors: BABYLON.Color3[];
        m: number[];
        lat: number;
        lng: number;
        steps: number;
        tickDuration: number;
        mesh: BABYLON.Mesh;
        ribbonOptions: any;
        private _morphing;
        private _currentStep;
        constructor(renderer: Renderer);
        /**
         * Met à jour les paths selon la fonction harmonique
         */
        computeHarmonics(paths: BABYLON.Vector3[][]): void;
        /**
         * Génère une nouvelle harmonique sphérique cible.
         * Met à jour les valeurs cibles, les couleurs cibles et les pas de progression pour atteindre cette nouvelle harmonique.
         */
        generateHarmonics(): void;
        /**
         * Transforme la géométrie et les couleurs du mesh
         */
        morphRibbon(): void;
        createScene(): BABYLON.Scene;
    }
}

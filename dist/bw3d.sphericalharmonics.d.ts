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
        private _morphing;
        private _currentStep;
        number: number;
        constructor(renderer: Renderer);
        /**
         * Met à jour les paths selon la fonction harmonique
         */
        computeHarmonics(paths: BABYLON.Vector3[][]): void;
        /**
         * Génère une nouvelle harmonique sphérique.
         * Met à jour les valeurs cibles, les couleurs cibles et les pas de progression pour atteindre cette nouvelle harmonique.
         */
        generateHarmonics(): void;
        /**
         * Transforme la géométrie et les couleurs du mesh
         */
        morph(): void;
        createScene(): BABYLON.Scene;
    }
}

declare module BW3D {
    class DeviceLogicalRender {
        device: Device;
        mesh: BABYLON.Mesh;
        gui: BABYLON.Mesh;
        constructor(device: Device, mesh: BABYLON.Mesh, gui: BABYLON.Mesh);
    }
    class HeartBeat {
        scene: BABYLON.Scene;
        renderer: Renderer;
        engine: BABYLON.Engine;
        canvas: HTMLCanvasElement;
        devices: {};
        interfaceMetrics: {};
        ifaces3d: {};
        ifaceMetrics: {};
        devicesLR: {};
        constructor(renderer: Renderer);
    }
}

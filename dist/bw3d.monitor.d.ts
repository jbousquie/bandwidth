declare module BW3D {
    class Device {
        name: string;
        description: string;
        ip: string;
        snmpCommunity: string;
        snmpVersion: string;
        position: number[];
        interfaces: {};
        /**
         * Constructor
         */
        constructor(name: string);
        /**
         * Ajoute une interface au Device
         * @param iface
         */
        addInterface(iface: Interface): Device;
    }
    class Interface {
        device: Device;
        name: string;
        description: string;
        metrics: Metrics;
        metricsLog: Metrics[];
        link: string;
        /**
         * Constructor
         */
        constructor(name: string);
    }
    /**
     * Monitor : gestionnaire des mesures
     */
    class Monitor {
        devices: {};
        urlDevices: string;
        urlData: string;
        interfaceData: {};
        interfaceMetrics: {};
        delay: number;
        isReady: boolean;
        visualizationType: number;
        renderer: Renderer;
        private interval;
        private defaultDelay;
        /**
         * Constructor
         */
        constructor(urlDevices: string, urlData: string, delay: number, visualizationType: number);
        /**
         * Charge ou met à jour les Devices à monitorer depuis le fichier json de description des équipements.
         * Idem pour les Interfaces.
         * Indexe le tableau interfaceMetrics[deviceName@ifaceName]
         */
        reloadDevices(): Monitor;
        /**
         * Recharge les dernières données de mesure actualisées depuis le fichier json
         */
        reloadData(): void;
        private _registerDataDownload;
        private _unregisterDataDownload;
        /**
         * Calcule les vitesses à partir des données de mesure passées.
         * et les objets Metrics de chaque instance d'Interface
         * @param data
         */
        computeMetrics(data: any[]): Monitor;
        /**
         * Crée un objet Renderer et lance la visualisation du type choisi.
         */
        visualize(): Monitor;
    }
    /**
     * Metrics : mesure de bande passante
     */
    class Metrics {
        speedIn: number;
        speedOut: number;
        rateIn: number;
        rateOut: number;
        ts: Date;
        interface: Interface;
        constructor(iface: Interface);
    }
}
declare const init: () => void;

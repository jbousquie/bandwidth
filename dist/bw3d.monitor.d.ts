declare module BW3D {
    class Device {
        name: string;
        description: string;
        ip: string;
        snmpCommunity: string;
        snmpVersion: string;
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
        speedMax: number;
        speedIN: number[];
        speedOUT: number[];
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
        delay: number;
        private interval;
        private defaultDelay;
        /**
         * Constructor
         */
        constructor(urlDevices: string, urlData: string, delay: number);
        /**
         * Charge ou met à jour les Devices à monitorer depuis le fichier json de description des équipements
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
         * @param data
         */
        computeMetrics(data: any[]): Monitor;
    }
}
declare const init: () => void;

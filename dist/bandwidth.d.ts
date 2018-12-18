declare module BW {
    class Device {
        name: string;
        description: string;
        ip: string;
        snmpCommunity: string;
        snmpVersion: string;
        interfaces: Interface[];
        /**
         * Constructor
         */
        constructor(name: string);
    }
    class Interface {
        device: Device;
        name: string;
        description: string;
        speed: number;
        link: string;
        /**
         * Constructor
         */
        constructor(name: string, device: Device);
    }
    /**
     * Monitor : gestionnaire des mesures
     */
    class Monitor {
        devices: Device[];
        urlDevices: string;
        urlData: string;
        delay: number;
        private interval;
        /**
         * Constructor
         */
        constructor(urlDevices: string, urlData: string, delay: number);
        /**
         * Charge ou met à jour les Devices à monitorer depuis le fichier json de description des équipements
         */
        reloadDevices(): Monitor;
        getMonitoredByName(name: string): Device;
        reloadData(): void;
        private _registerDataDownload;
        private _unregisterDataDownload;
    }
}
declare const init: () => void;

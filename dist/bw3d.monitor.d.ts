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
        /**
         * Retourne le Device monitoré portant le nom "name" ou null si non trouvé
         * */
        getDeviceByName(name: string): Device;
        /**
         * Recharge les dernières données de mesure actualisées depuis le fichier json
         */
        reloadData(): void;
        private _registerDataDownload;
        private _unregisterDataDownload;
    }
}
declare const init: () => void;

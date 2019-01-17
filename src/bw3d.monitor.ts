module BW3D {
    export class Device {
        public name: string;
        public displayName: string;
        public description: string;
        public ip: string;
        public snmpCommunity: string;
        public snmpVersion: string;
        public position: number[];
        public interfaces: {};
        public interfaceNumber: number = 0;
        public mesh: BABYLON.Mesh;
        public guiMesh: any;

        /**
         * Constructor
         */
        constructor(name: string) {
            this.name = name;
        }

        /**
         * Ajoute une interface au Device
         * @param iface
         */
        public addInterface(iface: Interface): Device {
            this.interfaces[iface.name] = iface;
            iface.device = this;
            return this;
        }
    }

    export class Interface {
        public device: Device;
        public name: string;
        public description: string;
        public metrics: Metrics;            // métrique courant de la mesure : dernier métrique
        public metricsLog: Metrics[];       // tableau de n derniers métriques
        public metricsLerp: Metrics;        // métrique courant calculé, interpolé entre le dernier et l'avant dernier
        public link: string;
        public mesh: BABYLON.Mesh;
        public guiMesh: BABYLON.Mesh;
        public gui: any;
        public sps: BABYLON.SolidParticleSystem;

        /**
         * Constructor
         */
        constructor(name: string) {
            this.name = name;
        }
        /**
         * Calcule les valeurs interpolées par factor (entre 0 et 1) entre la mesure courante et la précédente.
         * Met à jour l'objet .metricsLerp avec le résultat de ce calcul
         * @param factor 
         */
        public updateMetricsLerp(factor: number): Interface {
            let m = this.metrics;
            let p = this.metricsLog[this.metricsLog.length - 2];
            if (m && p) {
                let lerp = this.metricsLerp;
                lerp.speedIn = p.speedIn + (m.speedIn - p.speedIn) * factor;
                lerp.speedOut = p.speedOut + (m.speedOut - p.speedOut) * factor;
                lerp.rateIn = p.rateIn + (m.rateIn - p.rateIn) * factor;
                lerp.rateOut = p.rateOut + (m.rateOut - p.rateOut) * factor;
            }
            return this;
        }
    }

    /**
     * Monitor : gestionnaire des mesures
     */
    export class Monitor {
        public devices: {};                     // Annuaire des équipements
        public urlDevices: string;              // URL de la conf des équipements
        public urlData: string;                 // URL des data
        public interfaceData: {};               // Annuaire des données collectées par interface
        public interfaceMetrics: {};            // Annuaire des interfaces et de leurs métriques
        public delay: number;                   // délai de récupération des data
        public isReady: boolean = false;        // le monitor a-t-il chargé la configuration des équipements ?
        public visualizationType: number = 0;   // type de visualisation demandé
        public renderer: Renderer;              // Renderer associé
        private interval: any;                  // intervalle + fonction de callback de récupération des data
        private defaultDelay: number = 15000;    // délai par défaut

        /**
         * Constructor
         */
        constructor(urlDevices: string, urlData: string, delay: number, visualizationType: number) {
            this.urlDevices = urlDevices;
            this.urlData = urlData;
            this.delay = (delay) ? delay : this.defaultDelay;
            this.visualizationType = (visualizationType === undefined) ? 0 : visualizationType;

            this.devices = {};                  // tableau associatif des devices indexés par leur nom
            this.interfaceData = {};            // tableau associatifs des données indexées par les noms d'interface
            this.interfaceMetrics = {};         // tableau associatifs des objets Interface indexé par le nom deviceName@ifaceName
            this.reloadDevices();               // récupération initiale des informations sur les équipements à monitorer
            this._registerDataDownload()        // enregistrement de la récupération des données de mesure à intervalle régulier
            this.reloadData();                  // récupération initiale immédiate des premières données
        }

        /**
         * Charge ou met à jour les Devices à monitorer depuis le fichier json de description des équipements.
         * Idem pour les Interfaces.
         * Indexe le tableau interfaceMetrics[deviceName@ifaceName]
         */
        public reloadDevices(): Monitor {
            // récupération initiale du fichier de descriptions des équipements
            const that = this;
            const xhr = new XMLHttpRequest();
            const url = this.urlDevices + "?" + Date.now();
            xhr.open('GET', url);
            xhr.onload = function(){
                const loadedDevices = JSON.parse(xhr.responseText);
                for (let d = 0; d < loadedDevices.length; d++) { 
                    let loadedDevice = loadedDevices[d];
                    const monitoredDevice = that.devices[loadedDevice.name];
                    var device: Device;
                    if (monitoredDevice) {
                        device = monitoredDevice;
                    } 
                    else {
                        device = new Device(loadedDevice.name);
                        that.devices[loadedDevice.name] = device;
                    }
                    device.ip = loadedDevice.ip;
                    device.snmpCommunity = loadedDevice.community;
                    device.snmpVersion = loadedDevice.version;
                    device.description = loadedDevice.description;
                    device.displayName = (loadedDevice.displayName) ? loadedDevice.displayName : device.name;
                    device.position = loadedDevice.coordinates;
                    device.interfaces = {};
                    let loadedInterfaces = loadedDevice.interfaces;
                    if (loadedInterfaces) {
                        let count = 0;
                        for (let n in loadedInterfaces) {
                            const iface = new Interface(n);
                            iface.link = loadedInterfaces[n];
                            iface.metricsLog = [];
                            device.addInterface(iface);
                            
                            let ifaceMetricName = loadedDevice.name + '@' + n;
                            that.interfaceMetrics[ifaceMetricName] = iface;
                            count++;
                        }
                        device.interfaceNumber = count;
                    }
                }
                // si le renderer n'est pas déjà démarré, on le lance
                if (!that.isReady) {
                    that.visualize();
                    that.isReady = true;
                }
            };
            xhr.send();

            return this;
        };

        /**
         * Recharge les dernières données de mesure actualisées depuis le fichier json
         */
        public reloadData() {
            const that = this;
            const url = this.urlData + "?" + Date.now();
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.onload = function(){
                const data = JSON.parse(xhr.responseText);
                if (data && data.length != 0) {
                    that.computeMetrics(data);
                }
            };
            xhr.send();
        }
        private _registerDataDownload() {
            const that = this;
            this.interval = window.setInterval(function() {
                    that.reloadData();
                },
                that.delay
            );
            this._unregisterDataDownload();
        }
        private _unregisterDataDownload() {
            const that = this;
            window.addEventListener("unload", function(e) {
                window.clearInterval(that.interval);
            });
        }
        /**
         * Calcule les vitesses à partir des données de mesure passées.
         * et les objets Metrics de chaque instance d'Interface
         * @param data 
         */
        public computeMetrics(data: any[]): Monitor {
            const interfaceData = this.interfaceData;

            // Reset des tableaux des interfaceData
            for (let n in interfaceData) {
                    if (interfaceData[n] === undefined) {
                        interfaceData[n] = [];
                    }
                    interfaceData[n].length = 0;
            }
            
            // Boucle sur les mesures issues du fichier json
            for (let d = 0; d < data.length; d++) {
                let dat = data[d];
                let ifname = dat.ifname;

                // au cas où une nouvelle interce apparaisse dans les mesures
                if (interfaceData[ifname] === undefined) {
                    interfaceData[ifname] = [];

                }
                let ifDataArray = interfaceData[ifname];
                ifDataArray.push(dat);
            }

            // boucle sur les données par interface et calcul des vitesses
            // il faut au moins deux mesures consécutives pour calculer une vitesse
            for (let n in interfaceData) {
                // on sort si le Monitor n'est pas encore prêt
                if (!this.isReady) {
                    return this;
                }
                
                // récupération des objets device, interface et metrics
                const split = n.split("@");
                const deviceName = split[0];
                const ifaceName = split[1];
                const device = this.devices[deviceName];
                const iface = device.interfaces[ifaceName];
                const metricsLog = iface.metricsLog;

                let ifDataArray = interfaceData[n];
                for (let d = 1; d < ifDataArray.length; d++) {

                    let speedIn = 0;
                    let speedOut = 0;

                    let current = ifDataArray[d];
                    let previous = ifDataArray[d - 1];

                    let deltaIn = current.in - previous.in;
                    let deltaOut = current.out - previous.out;
                    let deltaTime = current.ts - previous.ts;
                    let speedMax = current.speed;

                    if (deltaTime != 0) {
                        speedIn = deltaIn / deltaTime;
                        speedOut = deltaOut / deltaTime;
                    }

                    let i = d - 1;
                    var newMetrics = metricsLog[i];
                    if  (!newMetrics) {
                        newMetrics = new Metrics(iface);
                        metricsLog[i] = newMetrics;
                    }

                    newMetrics.speedIn = speedIn;
                    newMetrics.speedOut = speedOut;
                    newMetrics.rateIn = speedIn / speedMax;
                    newMetrics.rateOut = speedOut / speedMax;
                    newMetrics.ts = current.ts;
                    iface.metrics = newMetrics;
                }
                if (!iface.metricsLerp) {
                    iface.metricsLerp = new Metrics(iface);
                }
                iface.description = ifDataArray[ifDataArray.length - 1].description;
            }
            // Si un renderer est attaché au Monitor, on lui notifie la fin du calcul
            if (this.renderer) {
                this.renderer.notify("metrics");
            }

            return this;
        }
        /**
         * Crée un objet Renderer et lance la visualisation du type choisi.
         */
        public visualize(): Monitor {
            const renderer = new BW3D.Renderer(this, this.visualizationType);
            this.renderer = renderer;
            renderer.start(); 
            return this;
        }
    }
    
    /**
     * Metrics : mesure de bande passante
     */
    export class Metrics {
        public speedIn: number;
        public speedOut: number;
        public rateIn: number;
        public rateOut: number;
        public ts: Date;
        public interface: Interface;

        constructor(iface: Interface) {
            this.interface = iface; 
        }
    }

}


const init =  function() {
    // paramètres (à déporter ultérieurement dans la conf)
    const delay = 3000;     // délai de rafraichissement des données en ms
    const urlData = 'bw3d.data.json'; // url des données de mesure
    const urlDevices = 'bw3d.devices.json'  // url des données des équipements

    const types = [
        BW3D.Renderer.HeartBeat,
        // mettre ici les autres types de rendus possibles


    ];

    let type = types[0];
    const param = parseInt(document.location.search.substring(1));
    if (!isNaN(param) && param < types.length) {
        type = types[param];
    }
   

    // Création du Monitor de données
    const monitor = new BW3D.Monitor(urlDevices, urlData, delay, type);
};
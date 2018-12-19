module BW3D {
    export class Device {
        public name: string;
        public description: string;
        public ip: string;
        public snmpCommunity: string;
        public snmpVersion: string;
        public interfaces: Interface[];

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
            this.interfaces.push(iface);
            return this;
        }
    }

    export class Interface {
        public device: Device;
        public name: string;
        public description: string;
        public speedMax: number;
        public speedIN: number[];
        public speedOUT: number[];
        public link: string;

        /**
         * Constructor
         */
        constructor(name: string, device: Device) {
            this.name = name;
            this.device = device;
            this.speedIN = [];
            this.speedOUT = [];
        }
    }

    /**
     * Monitor : gestionnaire des mesures
     */
    export class Monitor {
        public devices: Device[];
        public urlDevices: string;
        public urlData: string;
        public delay: number;
        private interval: any;
        private defaultDelay: 15000;

        /**
         * Constructor
         */
        constructor(urlDevices: string, urlData: string, delay: number) {
            this.urlDevices = urlDevices;
            this.urlData = urlData;
            this.delay = (delay) ? delay : this.defaultDelay;

            this.devices = [];
            this.reloadDevices();               // récupération initiale des informations sur les équipements à monitorer
            this._registerDataDownload()        // enregistrement de la récupération des données de mesure à intervalle régulier
            this.reloadData();                  // récupération initiale immédiate des premières données
        }

        /**
         * Charge ou met à jour les Devices à monitorer depuis le fichier json de description des équipements
         */
        public reloadDevices(): Monitor {
            // récupération initiale du fichier de descriptions des équipements
            const that = this;
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.urlDevices);
            xhr.addEventListener('readystatechange', function(){
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    const loadedDevice = JSON.parse(xhr.responseText);
                    const monitoredDevice = that.getDeviceByName(loadedDevice.name);
                    var device: Device;
                    if (monitoredDevice) {
                        device = monitoredDevice;
                    } 
                    else {
                        device = new Device(loadedDevice.name);
                        that.devices.push(device);
                    }
                    device.ip = loadedDevice.ip;
                    device.snmpCommunity = loadedDevice.snmpCommunity;
                    device.snmpVersion = loadedDevice.snmpVersion;
                    device.description = loadedDevice.description;
                    device.interfaces = [];
                    let loadedInterfaces = loadedDevice.interfaces;
                    if (loadedInterfaces) {
                        for (let i = 0; i < loadedInterfaces.length; i++) {
                            let loadedInterface = loadedInterfaces[i];
                            const iface = new Interface(loadedInterface.name, device);
                            iface.description = loadedInterface.description;
                            iface.speedMax = loadedInterface.speed;
                            iface.link = loadedInterface.link;
                            device.addInterface(iface);
                        }
                    }
                    
                }
            });
            xhr.send();
            console.log("devices ok");

            return this;
        };

        /**
         * Retourne le Device monitoré portant le nom "name" ou null si non trouvé 
         * */
        public getDeviceByName(name: string): Device {
            for (let i = 0; i < this.devices.length; i++) {
                let device = this.devices[i];
                if (device.name == name) {
                    return device;
                }
            }
            return null;
        };

        /**
         * Recharge les dernières données de mesure actualisées depuis le fichier json
         */
        public reloadData() {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.urlData);
            xhr.addEventListener('readystatechange', function(){
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    if (data) {
                        this.computeMetrics(data);
                    }
                }
            });
            xhr.send();
        }
        private _registerDataDownload() {
            const that = this;
            this.interval = window.setInterval(function() {
                    that.reloadData();
                },
                that.delay
            );
        }
        private _unregisterDataDownload() {
            window.clearInterval(this.interval);
        }
        /**
         * Calcule les vitesses à partir des données de mesure passées.
         * @param data 
         */
        public computeMetrics(data: []): Monitor {
            
            return this;
        }

    }
    

}


const init =  function() {
    // paramètres (à déporter ultérieurement dans la conf)
    const delay = 2000;     // délai de rafraichissement des données en ms
    const urlData = 'http://localhost/BJS/bandwidth/bw3d.data.json'; // url des données de mesure
    const urlDevices = 'http://localhost/BJS/bandwidth/bw3d.devices.json'  // url des données des équipements


    // Création du Monitor de données
    const monitor = new BW3D.Monitor(urlDevices, urlData, delay);

    // À migrer dans renderer.ts !
    /*
    // creation de la scene 3D et du compteur FPS
    const canvas = document.querySelector('#renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    const scene = createScene(canvas, engine);
    window.addEventListener("resize", function() {
        engine.resize();
    });


    const limit = 20;
    var count = 0;
    var fps = 0;
    const fpsElem = document.querySelector("#fps");
    engine.runRenderLoop(function(){
        count++;
        scene.render();
        if (count == limit) {
            fps = Math.floor(engine.getFps());
            fpsElem.innerHTML = fps.toString() + " fps";
            count = 0;
        }
    })
    */
};
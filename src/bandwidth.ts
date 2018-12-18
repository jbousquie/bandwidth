module BW {
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


    }

    export class Interface {
        public device: Device;
        public name: string;
        public description: string;
        public speed: number;
        public link: string

        /**
         * Constructor
         */
        constructor(name: string, device: Device) {
            this.name = name;
            this.device = device;
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

        /**
         * Constructor
         */
        constructor(urlDevices: string, urlData: string, delay: number) {
            this.urlDevices = urlDevices;
            this.urlData = urlData;
            this.delay = delay | 15000;

            this.reloadDevices();               // récupération initiale des informations sur les équipements à monitorer
            this._registerDataDownload()        // enregistrement de la récupération des données de mesure à intervalle régulier
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
                    const monitoredDevice = that.getMonitoredByName(loadedDevice.name);
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
                }
            });
            xhr.send();

            return this;
        };

        // Retourne le Device monitoré portant le nom "name" ou null si non trouvé
        public getMonitoredByName(name: string): Device {
            for (let i = 0; i < this.devices.length; i++) {
                let device = this.devices[i];
                if (device.name == name) {
                    return device;
                }
            }
            return null;
        };

        public reloadData() {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.urlData);
            xhr.addEventListener('readystatechange', function(){
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    // BW.updateData(data)
                    console.log(data[data.length - 1].ts);
                }
            });
            xhr.send();
        }
        private _registerDataDownload() {
            this.interval = window.setInterval(function() {
                    this.reloadData(this.urlData)
                },
                this.delay
            );
        }
        private _unregisterDataDownload() {
            window.clearInterval(this.interval);
        }

    }
    


}


const init =  function() {
    // paramètres (à déporter ultérieurement dans la conf)
    const delay = 2000;     // délai de rafraichissement des données en ms
    const urlData = 'http://localhost/BJS/bandwidth/bandwidth_results.json'; // url des données de mesure
    const urlDevices = 'http://localhost/BJS/bandwidth/bandwidth_conf.json'  // url des données des équipements


    // Création du Monitor de données
    const monitor = new BW.Monitor(urlDevices, urlData, delay);


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
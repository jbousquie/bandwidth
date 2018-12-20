var BW3D;
(function (BW3D) {
    class Device {
        /**
         * Constructor
         */
        constructor(name) {
            this.name = name;
        }
        /**
         * Ajoute une interface au Device
         * @param iface
         */
        addInterface(iface) {
            this.interfaces[iface.name] = iface;
            iface.device = this;
            return this;
        }
    }
    BW3D.Device = Device;
    class Interface {
        /**
         * Constructor
         */
        constructor(name) {
            this.name = name;
        }
    }
    BW3D.Interface = Interface;
    /**
     * Monitor : gestionnaire des mesures
     */
    class Monitor {
        /**
         * Constructor
         */
        constructor(urlDevices, urlData, delay) {
            this.urlDevices = urlDevices;
            this.urlData = urlData;
            this.delay = (delay) ? delay : this.defaultDelay;
            this.devices = {}; // tableau associatif des devices indexés par leur nom
            this.interfaceData = {}; // tableau associatifs des données indexées par les noms d'interface
            this.reloadDevices(); // récupération initiale des informations sur les équipements à monitorer
            this._registerDataDownload(); // enregistrement de la récupération des données de mesure à intervalle régulier
            this.reloadData(); // récupération initiale immédiate des premières données
        }
        /**
         * Charge ou met à jour les Devices à monitorer depuis le fichier json de description des équipements
         */
        reloadDevices() {
            // récupération initiale du fichier de descriptions des équipements
            const that = this;
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.urlDevices);
            xhr.addEventListener('readystatechange', function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    const loadedDevices = JSON.parse(xhr.responseText);
                    for (let d = 0; d < loadedDevices.length; d++) {
                        let loadedDevice = loadedDevices[d];
                        const monitoredDevice = that.devices[loadedDevice.name];
                        var device;
                        if (monitoredDevice) {
                            device = monitoredDevice;
                        }
                        else {
                            device = new Device(loadedDevice.name);
                            that.devices[loadedDevice.name] = device;
                        }
                        device.ip = loadedDevice.ip;
                        device.snmpCommunity = loadedDevice.snmpCommunity;
                        device.snmpVersion = loadedDevice.snmpVersion;
                        device.description = loadedDevice.description;
                        device.interfaces = [];
                        let loadedInterfaces = loadedDevice.interfaces;
                        if (loadedInterfaces) {
                            for (let n in loadedInterfaces) {
                                const iface = new Interface(n);
                                iface.link = loadedInterfaces[n];
                                iface.metricsLog = [];
                                device.addInterface(iface);
                            }
                        }
                    }
                }
            });
            xhr.send();
            return this;
        }
        ;
        /**
         * Recharge les dernières données de mesure actualisées depuis le fichier json
         */
        reloadData() {
            const that = this;
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.urlData);
            xhr.addEventListener('readystatechange', function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    if (data && data.length != 0) {
                        that.computeMetrics(data);
                    }
                }
            });
            xhr.send();
        }
        _registerDataDownload() {
            const that = this;
            this.interval = window.setInterval(function () {
                that.reloadData();
            }, that.delay);
            this._unregisterDataDownload();
        }
        _unregisterDataDownload() {
            const that = this;
            window.onunload = function () {
                window.clearInterval(that.interval);
            };
        }
        /**
         * Calcule les vitesses à partir des données de mesure passées.
         * @param data
         */
        computeMetrics(data) {
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
                    if (!newMetrics) {
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
                iface.description = ifDataArray[ifDataArray.length - 1].description;
            }
            return this;
        }
    }
    BW3D.Monitor = Monitor;
    /**
     * Metrics : mesure de bande passante
     */
    class Metrics {
        constructor(iface) {
            this.interface = iface;
        }
    }
    BW3D.Metrics = Metrics;
})(BW3D || (BW3D = {}));
const init = function () {
    // paramètres (à déporter ultérieurement dans la conf)
    const delay = 3000; // délai de rafraichissement des données en ms
    const urlData = 'http://localhost/BJS/bandwidth/bw3d.data.json'; // url des données de mesure
    const urlDevices = 'http://localhost/BJS/bandwidth/bw3d.devices.json'; // url des données des équipements
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
//# sourceMappingURL=bw3d.monitor.js.map
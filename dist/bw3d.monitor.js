var BW3D;
(function (BW3D) {
    var Device = /** @class */ (function () {
        /**
         * Constructor
         */
        function Device(name) {
            this.name = name;
        }
        /**
         * Ajoute une interface au Device
         * @param iface
         */
        Device.prototype.addInterface = function (iface) {
            this.interfaces[iface.name] = iface;
            iface.device = this;
            return this;
        };
        return Device;
    }());
    BW3D.Device = Device;
    var Interface = /** @class */ (function () {
        /**
         * Constructor
         */
        function Interface(name) {
            this.name = name;
            this.speedIN = [];
            this.speedOUT = [];
        }
        return Interface;
    }());
    BW3D.Interface = Interface;
    /**
     * Monitor : gestionnaire des mesures
     */
    var Monitor = /** @class */ (function () {
        /**
         * Constructor
         */
        function Monitor(urlDevices, urlData, delay) {
            this.urlDevices = urlDevices;
            this.urlData = urlData;
            this.delay = (delay) ? delay : this.defaultDelay;
            this.devices = {}; // tableau associatif des devices indexés par leur nom
            this.reloadDevices(); // récupération initiale des informations sur les équipements à monitorer
            this._registerDataDownload(); // enregistrement de la récupération des données de mesure à intervalle régulier
            this.reloadData(); // récupération initiale immédiate des premières données
        }
        /**
         * Charge ou met à jour les Devices à monitorer depuis le fichier json de description des équipements
         */
        Monitor.prototype.reloadDevices = function () {
            // récupération initiale du fichier de descriptions des équipements
            var that = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', this.urlDevices);
            xhr.addEventListener('readystatechange', function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    var loadedDevices = JSON.parse(xhr.responseText);
                    for (var d = 0; d < loadedDevices.length; d++) {
                        var loadedDevice = loadedDevices[d];
                        var monitoredDevice = that.devices[loadedDevice.name];
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
                        var loadedInterfaces = loadedDevice.interfaces;
                        if (loadedInterfaces) {
                            for (var i = 0; i < loadedInterfaces.length; i++) {
                                var loadedInterface = loadedInterfaces[i];
                                var iface = new Interface(loadedInterface.name);
                                iface.description = loadedInterface.description;
                                iface.speedMax = loadedInterface.speed;
                                iface.link = loadedInterface.link;
                                device.addInterface(iface);
                            }
                        }
                    }
                }
            });
            xhr.send();
            return this;
        };
        ;
        /**
         * Recharge les dernières données de mesure actualisées depuis le fichier json
         */
        Monitor.prototype.reloadData = function () {
            var that = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', this.urlData);
            xhr.addEventListener('readystatechange', function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);
                    if (data && data.length != 0) {
                        that.computeMetrics(data);
                    }
                }
            });
            xhr.send();
        };
        Monitor.prototype._registerDataDownload = function () {
            var that = this;
            this.interval = window.setInterval(function () {
                that.reloadData();
            }, that.delay);
        };
        Monitor.prototype._unregisterDataDownload = function () {
            window.clearInterval(this.interval);
        };
        /**
         * Calcule les vitesses à partir des données de mesure passées.
         * @param data
         */
        Monitor.prototype.computeMetrics = function (data) {
            for (var d = 0; d < data.length; d++) {
                var dat = data[d];
                var split = dat.ifname.split("@");
                var deviceName = split[0];
                var ifaceName = split[1];
                var device = this.devices[deviceName];
                var interface = device.interface[ifaceName];
            }
            return this;
        };
        return Monitor;
    }());
    BW3D.Monitor = Monitor;
})(BW3D || (BW3D = {}));
var init = function () {
    // paramètres (à déporter ultérieurement dans la conf)
    var delay = 2000; // délai de rafraichissement des données en ms
    var urlData = 'http://localhost/BJS/bandwidth/bw3d.data.json'; // url des données de mesure
    var urlDevices = 'http://localhost/BJS/bandwidth/bw3d.devices.json'; // url des données des équipements
    // Création du Monitor de données
    var monitor = new BW3D.Monitor(urlDevices, urlData, delay);
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
var BW;
(function (BW) {
    var Device = /** @class */ (function () {
        /**
         * Constructor
         */
        function Device(name) {
            this.name = name;
        }
        return Device;
    }());
    BW.Device = Device;
    var Interface = /** @class */ (function () {
        /**
         * Constructor
         */
        function Interface(name, device) {
            this.name = name;
            this.device = device;
        }
        return Interface;
    }());
    BW.Interface = Interface;
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
            this.delay = delay | 15000;
            this.reloadDevices(); // récupération initiale des informations sur les équipements à monitorer
            this._registerDataDownload(); // enregistrement de la récupération des données de mesure à intervalle régulier
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
                    var loadedDevice = JSON.parse(xhr.responseText);
                    var monitoredDevice = that.getMonitoredByName(loadedDevice.name);
                    var device;
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
        ;
        // Retourne le Device monitoré portant le nom "name" ou null si non trouvé
        Monitor.prototype.getMonitoredByName = function (name) {
            for (var i = 0; i < this.devices.length; i++) {
                var device = this.devices[i];
                if (device.name == name) {
                    return device;
                }
            }
            return null;
        };
        ;
        Monitor.prototype.reloadData = function () {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', this.urlData);
            xhr.addEventListener('readystatechange', function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);
                    // BW.updateData(data)
                    console.log(data[data.length - 1].ts);
                }
            });
            xhr.send();
        };
        Monitor.prototype._registerDataDownload = function () {
            this.interval = window.setInterval(function () {
                this.reloadData(this.urlData);
            }, this.delay);
        };
        Monitor.prototype._unregisterDataDownload = function () {
            window.clearInterval(this.interval);
        };
        return Monitor;
    }());
    BW.Monitor = Monitor;
})(BW || (BW = {}));
var init = function () {
    // paramètres (à déporter ultérieurement dans la conf)
    var delay = 2000; // délai de rafraichissement des données en ms
    var urlData = 'http://localhost/BJS/bandwidth/bandwidth_results.json'; // url des données de mesure
    var urlDevices = 'http://localhost/BJS/bandwidth/bandwidth_conf.json'; // url des données des équipements
    // Création du Monitor de données
    var monitor = new BW.Monitor(urlDevices, urlData, delay);
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
//# sourceMappingURL=bandwidth.js.map
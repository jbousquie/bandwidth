var BW3D;(function(BW3D){var Device=function(){function Device(name){this.name=name}Device.prototype.addInterface=function(iface){this.interfaces.push(iface);return this};return Device}();BW3D.Device=Device;var Interface=function(){function Interface(name,device){this.name=name;this.device=device;this.speedIN=[];this.speedOUT=[]}return Interface}();BW3D.Interface=Interface;var Monitor=function(){function Monitor(urlDevices,urlData,delay){this.urlDevices=urlDevices;this.urlData=urlData;this.delay=delay|15e3;this.reloadDevices();this._registerDataDownload()}Monitor.prototype.reloadDevices=function(){var that=this;var xhr=new XMLHttpRequest;xhr.open("GET",this.urlDevices);xhr.addEventListener("readystatechange",function(){if(xhr.readyState===XMLHttpRequest.DONE&&xhr.status===200){var loadedDevice=JSON.parse(xhr.responseText);var monitoredDevice=that.getDeviceByName(loadedDevice.name);var device;if(monitoredDevice){device=monitoredDevice}else{device=new Device(loadedDevice.name);that.devices.push(device)}device.ip=loadedDevice.ip;device.snmpCommunity=loadedDevice.snmpCommunity;device.snmpVersion=loadedDevice.snmpVersion;device.description=loadedDevice.description;device.interfaces=[];var loadedInterfaces=loadedDevice.interfaces;if(loadedInterfaces){for(var i=0;i<loadedInterfaces.length;i++){var loadedInterface=loadedInterfaces[i];var iface=new Interface(loadedInterface.name,device);iface.description=loadedInterface.description;iface.speedMax=loadedInterface.speed;iface.link=loadedInterface.link;device.addInterface(iface)}}}});xhr.send();return this};Monitor.prototype.getDeviceByName=function(name){for(var i=0;i<this.devices.length;i++){var device=this.devices[i];if(device.name==name){return device}}return null};Monitor.prototype.reloadData=function(){var xhr=new XMLHttpRequest;xhr.open("GET",this.urlData);xhr.addEventListener("readystatechange",function(){if(xhr.readyState===XMLHttpRequest.DONE&&xhr.status===200){var data=JSON.parse(xhr.responseText);console.log(data[data.length-1].ts)}});xhr.send()};Monitor.prototype._registerDataDownload=function(){this.interval=window.setInterval(function(){this.reloadData(this.urlData)},this.delay)};Monitor.prototype._unregisterDataDownload=function(){window.clearInterval(this.interval)};return Monitor}();BW3D.Monitor=Monitor})(BW3D||(BW3D={}));var init=function(){var delay=2e3;var urlData="http://localhost/BJS/bandwidth/bw3d.data.json";var urlDevices="http://localhost/BJS/bandwidth/bw3d.devices.json";console.log("coucou");var monitor=new BW3D.Monitor(urlDevices,urlData,delay);console.log("coucou")};var BW3D;(function(BW3D){var Renderer=function(){function Renderer(){}return Renderer}();BW3D.Renderer=Renderer})(BW3D||(BW3D={}));
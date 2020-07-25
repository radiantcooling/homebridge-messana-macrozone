var Service, Characteristic;
var request = require("request");
const defaultJSON = require('./../default.json')
const packageJSON = require('./../package.json')
const util = require('./../util.js')

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("messana-macrozone", "ThermostatMacro", ThermostatMacro);
};

function ThermostatMacro(log, config, api) {
  this.apikey = util.getApiKey(api)
  this.log = log;
  this.config = config
  this.id = config.id
  this.name = config.name;
  this.model = packageJSON.models[0];
  this.apiroute = util.staticValues.apiroute
  this.temperatureDisplayUnits = defaultJSON.temperatureUnit || 1;
  this.maxTemp = 90;
  this.minTemp = 60;
  this.targetTemperature = 25;
  this.currentTemperature = 20;
  this.targetHeatingCoolingState = 3;
  this.heatingCoolingState = 1;

  this.service = new Service.Thermostat(this.name);
}

ThermostatMacro.prototype = {

  identify: function(callback) {
    // this.log("Identify requested!");
    callback();
  },

  getTargetHeatingCoolingState: function(callback) {
    // this.log("[+] getTargerHeatingCoolingState from:", this.apiroute + defaultJSON.macrozone.apis.getState + this.id + "?apikey=" + this.apikey);
    var url = this.apiroute + defaultJSON.system.apis.getSystemOn + "?apikey=" + this.apikey;
    util.httpRequest(url, '', 'GET', function(error, response, responseBody) {
      if (error) {
        this.log("[!] Error getting System State: %s", error.message);
        callback(error);
      } else {
        try{
          var json = JSON.parse(responseBody);
        }
        catch(err){
          callback(-1);
          return
        }
        this.onSystem = (json.status == 0)? false : true
        if(!this.onSystem) {
          this.on = 0
          callback(null, this.on);
        }
        else {

          var url = this.apiroute + defaultJSON.macrozone.apis.getState + this.id + "?apikey=" + this.apikey;
          util.httpRequest(url, '', 'GET', function(error, response, responseBody) {
            if (error) {
              this.log("[!] Error getting targetHeatingCoolingState: %s", error.message);
              callback(error);
            } else {
              try{
                var json = JSON.parse(responseBody);
              }
              catch(err){
                callback(-1);
                return
              }
              this.targetHeatingCoolingState = (json.status) ? 3 : 0;
              // this.log("[*] targetHeatingCoolingState: %s", this.targetHeatingCoolingState);
              callback(null, this.targetHeatingCoolingState);
            }
          }.bind(this));

        }
      }
    }.bind(this));


  },

  setTargetHeatingCoolingState: function(value, callback) {
    // this.log("[+] setTargetHeatingCoolingState from:", this.apiroute + defaultJSON.macrozone.apis.setState + "?apikey=" + this.apikey);
    if(!this.onSystem){
      this.log("System OFF - Unable to change mode")
      callback();
      return
    }
    url = this.apiroute + defaultJSON.macrozone.apis.setState + "?apikey=" + this.apikey;
    if(value == 3) value = 1
    else value = 0
    var body = {
      id: this.id,
      value: value
    }
    util.httpRequest(url, body, 'PUT', function(error, response, responseBody) {
      if (error) {
        this.log("[!] Error setting targetHeatingCoolingState", error.message);
        callback(error);
      } else {
        this.log("[*] Sucessfully set targetHeatingCoolingState to %s", value);
        callback();
      }
    }.bind(this));
  },

  getCurrentTemperature: function(callback) {
    // this.log("[+] getCurrentTemperature from:", this.apiroute + defaultJSON.macrozone.apis.getCurrentTemperature + this.id + "?apikey=" + this.apikey);
    var url = this.apiroute + defaultJSON.macrozone.apis.getCurrentTemperature + this.id + "?apikey=" + this.apikey;
    util.httpRequest(url, '', 'GET', function(error, response, responseBody) {
      if (error) {
        this.log("[!] Error getting currentTemperature: %s", error.message);
        callback(error);
      } else {
        try{
          var json = JSON.parse(responseBody);
        }
        catch(err){
          callback(-1);
          return
        }
        this.currentTemperature = util.convertF2C(parseFloat(json.value), this.temperatureDisplayUnits)
        callback(null, this.currentTemperature.toFixed(2));
      }
    }.bind(this));
  },

  getTargetTemperature: function(callback) {
    // this.log("[+] getTargetTemperature from:", this.apiroute + defaultJSON.macrozone.apis.getTargetTemperature + this.id + "?apikey=" + this.apikey);
    var url = this.apiroute + defaultJSON.macrozone.apis.getTargetTemperature + this.id + "?apikey=" + this.apikey;
    util.httpRequest(url, '', 'GET', function(error, response, responseBody) {
      if (error) {
        this.log("[!] Error getting currentTemperature: %s", error.message);
        callback(error);
      } else {
        try{
          var json = JSON.parse(responseBody);
        }
        catch(err){
          callback(-1);
          return
        }
        this.targetTemperature = util.convertF2C(json.value, this.temperatureDisplayUnits);
        callback(null, this.targetTemperature.toFixed(2));
      }
    }.bind(this));
  },

  setTargetTemperature: function(value, callback) {
    this.targetTemperature = util.convertC2F(value, this.temperatureDisplayUnits)
    var url = this.apiroute + defaultJSON.macrozone.apis.setTargetTemperature + "?apikey=" + this.apikey
    var body = {
      id: this.id,
      value: this.targetTemperature
    }
    util.httpRequest(url, body, 'PUT', function(error, response, responseBody) {
      if (error) {
        this.log("[!!!!!!!] Error setting targetTemperature", error.message);
        callback(error);
      } else {
        this.log("[*******] Sucessfully set targetTemperature to %s", value);
        callback();
      }
    }.bind(this));
  },

  getTemperatureDisplayUnits: function(callback) {
    // this.log("getTemperatureDisplayUnits:", this.temperatureDisplayUnits);
    callback(null, this.temperatureDisplayUnits);
  },

  setTemperatureDisplayUnits: function(value, callback) {
    // this.log("[*] setTemperatureDisplayUnits from %s to %s", this.temperatureDisplayUnits, value);
    this.temperatureDisplayUnits = 1;
    callback();
  },

  getName: function(callback) {
    // this.log("getName :", this.name);
    callback(null, this.name);
  },

  getServices: function() {
    // this.log("***** getServices *******");
    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.Manufacturer, util.staticValues.manufacturer)
      .setCharacteristic(Characteristic.SerialNumber, defaultJSON.version);

    this.service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('get', this.getTargetHeatingCoolingState.bind(this))
      .on('set', this.setTargetHeatingCoolingState.bind(this));

    this.service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this));

    this.service
      .getCharacteristic(Characteristic.TargetTemperature)
      .on('get', this.getTargetTemperature.bind(this))
      .on('set', this.setTargetTemperature.bind(this));

    this.service
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', this.getTemperatureDisplayUnits.bind(this))
      .on('set', this.setTemperatureDisplayUnits.bind(this));

    this.service
      .getCharacteristic(Characteristic.Name)
      .on('get', this.getName.bind(this));

    this.service.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: 0,
        maxValue: 100,
        minStep: 0.5
      });

      var characteristic = this.service.getCharacteristic( Characteristic.TargetTemperature );
      characteristic
        .setProps({
          minValue: util.convertF2C(this.config.min || this.minTemp, this.temperatureDisplayUnits),
          maxValue: util.convertF2C(this.config.max  || this.maxTemp, this.temperatureDisplayUnits),
          minStep: 0.1
        });

    setInterval(function() {

      this.getTargetTemperature(function(err, temp) {
        if (err) {temp = err;}
        this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(temp);
      }.bind(this));

      this.getTargetHeatingCoolingState(function(err, temp) {
        if (err) { temp = err; }
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(temp);
      }.bind(this));

    }.bind(this), defaultJSON.refreshMacrozone * 1000);

    this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).props.validValues = [0, 3];
    this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits ).props.minValue = defaultJSON.temperatureUnit;

    return [this.informationService, this.service];
  }
};

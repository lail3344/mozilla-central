var kBTTimeout = 3000;
var kQemuTimeout = 3000;

var kBDAddress = "56:34:12:00:54:52";
var kName = "Full Android on Emulator";

// BT on/off must be through settings
SpecialPowers.addPermission("settings-read", true, document);
SpecialPowers.addPermission("settings-write", true, document);
var settings = window.navigator.mozSettings;
isnot(settings, null, "Settings should not be null");

function getTester() {
  return {
    state: undefined,
    get: function () {
      return this.state;
    },
    clear: function () {
      log("clear state");
      this.state = undefined;
    },
    set: function (state) {
      log("set state: " + state);
      this.state = state;    
    },
    isSet: function () {
      log("check state: " + this.state);
       return this.state !== undefined;
    },
    getBTProp: function (prop) {
      var that = this;
      that.state = undefined;
      runEmulatorCmd("bt get " + prop,
        function (results) {
          that.state = results[0];
        });
    },
    turnBTOnOff: function (on) {
      var that = this;
      that.clear();
      log("Turning BT " + (on? "on":"off") + "...");
      var req = settings.createLock().set({'bluetooth.enabled': on});
      req.onerror = function () {
        ok(false, "callback 'onerror' should never be called");
        that.state = req.error;
      }
    }
  };
};

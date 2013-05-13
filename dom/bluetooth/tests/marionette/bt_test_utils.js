/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
      log("Getting BT " + prop + "...");
      runEmulatorCmd("bt get " + prop,
        function (results) {
          that.state = results[0];
          log("Got BT " + prop + ": '" + that.state + "'");
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

function changeName(adapter, name, onsuccess, onerror) {
  log("set name to '" + name + "'");
  var rename = adapter.setName(name);
  rename.onsuccess = onsuccess;
  rename.onerror = onerror;
};

var kFakeRemotes = [
  { addr: "00:11:22:33:44:55", name: "fake remote#1" },
  { addr: "11:22:33:44:55:66", name: "fake remote#2" },
  { addr: "22:33:44:55:66:77", name: "fake remote#3" }
];

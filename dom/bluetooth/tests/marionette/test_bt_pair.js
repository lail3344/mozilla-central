/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 10000;

SpecialPowers.addPermission("bluetooth", true, document);

var navigator = window.navigator;
var req = navigator.mozBluetooth.getDefaultAdapter();
var tester = getTester();

navigator.mozSetMessageHandler('bluetooth-requestconfirmation',
  function (message) {
    log("sys msg:" + message + " - confirmation");
  });

navigator.mozSetMessageHandler('bluetooth-requestpincode',
  function (message) {
    log("sys msg:" + message + " - pincode");
  }
);

navigator.mozSetMessageHandler('bluetooth-requestpasskey',
  function (message) {
    log("sys msg:" + message + " - passkey");
  }
);

navigator.mozSetMessageHandler('bluetooth-cancel',
  function (message) {
    log("sys msg:" + message + " - cancel");
  }
);

navigator.mozSetMessageHandler('bluetooth-pairedstatuschanged',
  function (message) {
    log("sys msg:" + message + " - pairstatuschanged");
    dispatchEvent(new CustomEvent('bluetooth-pairedstatuschanged'));
  }
);

ok(req, "BT cannot get adapter");
req.onsuccess = function () {
  var adapter = req.result;
  var count = 0;

  isnot(adapter, null, "BT should not be null");

  log("start discovery");
  req = adapter.startDiscovery();

  adapter.onerror = function () {
    ok(false, "BT start discovery should never fail");
    finish();
  }

  var paired = adapter.getPairedDevices();
  //paired.onsuccess = function () {
  //  is(paired.result, undefined, "BT should not have paired device");
  //};
  paired.onerror = function () {
    ok(false, "getting paired devices should never fail");
    finish();
  };

  adapter.ondevicefound = function (evt) {
    var device = evt.device;
    is(device.address, kFakeRemotes[count].addr, "remote BD address not match");
    count++;
    if (count > kFakeRemotes.length) {
      ok(false, "more device than expected: " + kFakeRemotes.length + ", found: " + count);
      finish();
    } else if (count === kFakeRemotes.length) {
      setTimeout(
        function () {
          log("pairing: " + device.address);
          adapter.pair(device);
          setTimeout(function () {
            log("confirm pairing");
            adapter.setPairingConfirmation(device.address, true);
            setTimeout(function () {
              log("check paired devices...");
              var p = adapter.getPairedDevices();
              p.onsuccess = function () {
                isnot(p.result, undefined, "BT should have paired device");
                setTimeout(function () { finish(); }, kQemuTimeout);
              };
              p.onerror = function () {
                ok(false, "getting paired devices should never fail");
                finish();
              };
            }, 1000);
          }, 1000);
        }, 1000);
    }
  };
};

req.onerror = function () {
  var error = req.error;
  ok(false, "BT get adapter has error: " + error.name);
  finish();
};

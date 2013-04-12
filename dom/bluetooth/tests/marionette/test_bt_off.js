/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 100000;
var BT_TIMEOUT = 3000;
var result;

SpecialPowers.addPermission("bluetooth", true, document);
var bt = window.navigator.mozBluetooth;
isnot(bt, null, "BT should not be null");
bt.onenabled = function () {
  ok(false, "callback 'onenabled' should not be called when turning off BT");
};

bt.ondisabled = function () {
  log("BT turned off");
  result = "disabled";
};

// BT on/off must be through settings
SpecialPowers.addPermission("settings-read", true, document);
SpecialPowers.addPermission("settings-write", true, document);
var settings = window.navigator.mozSettings;
isnot(settings, null, "Settings should not be null");

var turnBTOnOff = function (on) {
  result = undefined;
  log("Turning BT off...");
  var req = settings.createLock().set({'bluetooth.enabled': false});
  req.onerror = function () {
    ok(false, "callback 'onerror' should never be called");
    result = req.error;
  }
};

function checkResult() {
  //log("checking state...");
  return result;
}

function makeTest() {
  return function () {
    if (result instanceof DOMError) {
      ok(false, "BT fail to disable. error: " + result.name);
    } else {
      is(bt.enabled, false, "BT should be disabled now");
    }
    finish();
  };
};

if (bt.enabled) {
  turnBTOnOff(false);
  waitFor(makeTest(), checkResult, BT_TIMEOUT);
} else {
  turnBTOnOff(false);
  setTimeout(
    function () {
      is(result, undefined, "Disabling BT when it's already off shouldn't invoke callbacks");
      is(bt.enabled, false, "Disabling BT when it's already off shouldn't change state");
      finish();
    }, BT_TIMEOUT);
}

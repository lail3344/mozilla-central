/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 100000;
var BT_TIMEOUT = 3000;
var result = undefined;

SpecialPowers.addPermission("bluetooth", true, document);
var bt = window.navigator.mozBluetooth;
isnot(bt, null, "BT should not be null");
bt.onenabled = function () {
  log("BT turned on");
  result = "enabled";
};

bt.ondisabled = function () {
  ok(false, "callback 'ondisabled' should not be called when turning on BT");
};

bt.onadapteradded = function () {
  log("Adapter found");
};

// BT on/off must be through settings
SpecialPowers.addPermission("settings-read", true, document);
SpecialPowers.addPermission("settings-write", true, document);
var settings = window.navigator.mozSettings;
isnot(settings, null, "Settings should not be null");

var turnBTOnOff = function (on) {
  result = undefined;
  log("Turning BT on...");
  var req = settings.createLock().set({'bluetooth.enabled': true});
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
      ok(false, "BT fail to enable. error: " + result.name);
    } else {
      is(bt.enabled, true, "BT should be enabled now");
    }
    finish();
  };
};

if (!bt.enabled) {
  turnBTOnOff(true);
  waitFor(makeTest(), checkResult, BT_TIMEOUT);
} else {
  turnBTOnOff(true);
  setTimeout(
    function () {
      is(result, undefined, "Enabling BT when it's already on shouldn't invoke callbacks");
      is(bt.enabled, true, "Enabling BT when it's already on shouldn't change state");
      finish();
    }, BT_TIMEOUT);
}


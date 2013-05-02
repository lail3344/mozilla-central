/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 100000;
var kBTTimeout = 3000;
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
  result = "disabled";
};

bt.onadapteradded = function () {
  log("Adapter found");
  result = "adapter found";
};

// BT on/off must be through settings
SpecialPowers.addPermission("settings-read", true, document);
SpecialPowers.addPermission("settings-write", true, document);
var settings = window.navigator.mozSettings;
isnot(settings, null, "Settings should not be null");

function turnBTOnOff(on) {
  result = undefined;
  log("Turning BT on...");
  var req = settings.createLock().set({'bluetooth.enabled': true});
  req.onerror = function () {
    ok(false, "callback 'onerror' should never be called");
    result = req.error;
  }
}

function checkResult() {
  log("checking state: " + result);
  return result !== undefined;
}

function setQemuResult(results) {
  result = results[0];
  log("QEMU: " + result);
}

function getBTProp(prop) {
  result = undefined;
  runEmulatorCmd("bt get " + prop, setQemuResult);
}

function makeTest(tester) {
  return function () {
    if (result instanceof DOMError) {
      ok(false, "BT fail to enable. error: " + result.name);
    } else {
      tester? tester():finish();
    }
  };
};

function checkEnabled() {
  is(bt.enabled, true, "BT should be enabled now");
  // wait for adapter found callback, then check
  result = undefined;
  waitFor(makeTest(checkAdapter), checkResult, kBTTimeout);
}

function checkAdapter() {
  getBTProp("name", setQemuResult);
  waitFor(
    function () {
      //isnot(result, "", "BT adatper should have name");
      finish();
    }, checkResult, kBTTimeout);
}

if (!bt.enabled) {
  turnBTOnOff(true);
  // wait for enabled callback, then check
  waitFor(makeTest(checkEnabled), checkResult, kBTTimeout);
} else {
  turnBTOnOff(true);
  setTimeout(
    function () {
      log("BT already turned on!");
      is(result, undefined, "Enabling BT when it's already on shouldn't invoke callbacks");
      is(bt.enabled, true, "Enabling BT when it's already on shouldn't change state");
      finish();
    }, kBTTimeout);
}

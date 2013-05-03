/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 100000;

var tester = getTester();

SpecialPowers.addPermission("bluetooth", true, document);
var bt = window.navigator.mozBluetooth;
isnot(bt, null, "BT should not be null");
bt.onenabled = function () {
  log("BT turned on");
  tester.set("enabled");
};

bt.ondisabled = function () {
  ok(false, "callback 'ondisabled' should not be called when turning on BT");
  tester.set("disabled");
};

bt.onadapteradded = function () {
  log("Adapter found");
  tester.set("adapter found");
};

function checkEnabled() {
  is(bt.enabled, true, "BT should be enabled now");
  // wait for adapter found callback, then check
  tester.clear();
  waitFor(checkAdapter, tester.isSet.bind(tester), kBTTimeout);
}

function checkAdapter() {
  tester.getBTProp("name");
  waitFor(
    function () {
      //isnot(tester.get(), "", "BT adatper should have name");
      finish();
    },  tester.isSet.bind(tester), kBTTimeout);
}

if (!bt.enabled) {
  tester.turnBTOnOff(true);
  // wait for enabled callback, then check
  waitFor(function () {
    if (tester.get() instanceof DOMError) {
      ok(false, "BT fail to enable. error: " + tester.get().name);
    } else {
      checkEnabled();
    }
    }, tester.isSet.bind(tester), kBTTimeout);
} else {
  tester.turnBTOnOff(true);
  setTimeout(
    function () {
      log("BT already turned on!");
      is(tester.get(), undefined, "Enabling BT when it's already on shouldn't invoke callbacks");
      is(bt.enabled, true, "Enabling BT when it's already on shouldn't change state");
      finish();
    }, kBTTimeout);
}

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
  ok(false, "callback 'onenabled' should not be called when turning off BT");
};

bt.ondisabled = function () {
  log("BT turned off");
  tester.set("disabled");
};

function checkDisabled() {
  if (tester.get() instanceof DOMError) {
    ok(false, "BT fail to disable. error: " + tester.get().name);
  } else {
    is(bt.enabled, false, "BT should be disabled now");
    // outsider check
    tester.getBTProp("name");
    waitFor(
      function () {
        is(tester.get(), "", "BT should be disabled");
        finish();
      }, tester.isSet.bind(tester), kBTTimeout);
  }
}

if (bt.enabled) {
  tester.turnBTOnOff(false);
  waitFor(checkDisabled, tester.isSet.bind(tester), kBTTimeout);
} else {
  tester.turnBTOnOff(false);
  setTimeout(
    function () {
      log("BT already turned off!");
      is(tester.get(), undefined, "Disabling BT when it's already off shouldn't invoke callbacks");
      is(bt.enabled, false, "Disabling BT when it's already off shouldn't change state");
      finish();
    }, kBTTimeout);
}

/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 10000;

SpecialPowers.addPermission("bluetooth", true, document);

var req = window.navigator.mozBluetooth.getDefaultAdapter();
var tester = getTester();

function makeMatchFunc(prop, expect) {
  return function () {
    tester.getBTProp(prop);
    waitFor(
      function () {
        log(prop + " - expect: " + expect + ", result: " + tester.get());
        is(expect, tester.get(), prop + " not match");
        finish();        
      }, tester.isSet.bind(tester), kQemuTimeout);
  };
};

function changeDiscoverable(adapter) {
  log("set discoverable: true");
  adapter.setDiscoverable(true);
  // setDiscoverable has no callback... delay before checking.
  setTimeout(function () {
    // after change
    log("changed discoverable: " + adapter.discoverable);
    is(adapter.discoverable, true, "BT should be discoverable now");
    (makeMatchFunc("discoverable", adapter.discoverable))();
  }, kQemuTimeout);
};

ok(req, "BT cannot get adapter");
req.onsuccess = function () {
  var adapter = req.result;
  isnot(adapter, null, "BT should not be null");
  // before change
  is(adapter.discoverable, false, "BT should not be discoverable");
  changeDiscoverable(adapter);
};

req.onerror = function () {
  var error = req.error;
  ok(false, "BT get adapter has error:" + error.name);
  finish();
};


/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 10000;

SpecialPowers.addPermission("bluetooth", true, document);

var req = window.navigator.mozBluetooth.getDefaultAdapter();
var tester = getTester();

function getMatchFunc(prop, expect, shouldFinish) {
  return function () {
    tester.getBTProp(prop);
    waitFor(
      function () {
        log(prop + " - expect: '" + expect + "', result: '" + tester.get() + "'");
        is(expect, tester.get(), prop + " not match");
        if (shouldFinish) {
          finish();
        }
      }, tester.isSet.bind(tester), kQemuTimeout);
  };
};

ok(req, "BT cannot get adapter");
req.onsuccess = function () {
  var adapter = req.result;
  var count = 0;

  isnot(adapter, null, "BT should not be null");

  log("start discovery");
  req = adapter.startDiscovery();
  
  setTimeout(
    function () {
      // check attribute
      is(adapter.discovering, true, "attr 'discovering' should be true");
      (getMatchFunc("discovering", '1', false))();
    }, 500);

  adapter.onerror = function () {
    ok(false, "BT start discovery should never fail");
    finish();
  }

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
          log("stop discovery");
          adapter.stopDiscovery();
          setTimeout(
            function () {
              (getMatchFunc("discovering", '0', true))();
            }, 1000);
        }, kQemuTimeout);
    }
  };
};

req.onerror = function () {
  var error = req.error;
  ok(false, "BT get adapter has error: " + error.name);
  finish();
};


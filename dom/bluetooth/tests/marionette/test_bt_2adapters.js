/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 10000;

SpecialPowers.addPermission("bluetooth", true, document);

var req1 = window.navigator.mozBluetooth.getDefaultAdapter();
var req2 = window.navigator.mozBluetooth.getDefaultAdapter();
var tester1 = getTester();
var tester2 = getTester();

function makeMatchFunc(tester, prop, expect, callback) {
  return function () {
    tester.getBTProp(prop);
    waitFor(
      function () {
        log(prop + " - expect: " + expect + ", result: " + tester.get());
        is(expect, tester.get(), prop + " not match");
        if (callback && callback instanceof Function) {
          callback();
        } else {
          finish();        
        }
      }, tester.isSet.bind(tester), kQemuTimeout);
  };
};

ok(req1, "BT cannot get adapter(1)");
ok(req2, "BT cannot get adapter(2)");
req1.onsuccess = function () {
  var adapter = req1.result;
  isnot(adapter, null, "BT should not be null");

  ok(adapter instanceof BluetoothAdapter, "BT adapter interface should be BluetoothAdapter");
  is(adapter.address, kBDAddress, "BD address not match");
  is(adapter.name, kName, "Name not match");
  is(adapter.discoverable, false, "attr 'discoverable' not match");
  is(adapter.discovering, false, "attr 'discovering' not match");
  // outsider check
  (makeMatchFunc(tester1, "addr", adapter.address,
    makeMatchFunc(tester1, "name", adapter.name,
      makeMatchFunc(tester1, "discoverable", adapter.discoverable? 1:0,
        makeMatchFunc(tester1, "discovering", adapter.discoverying? 1:0,
          function () { /* dummy callback to prevent early ending */ })))))();
};

req1.onerror = function () {
  var error = req1.error;
  ok(false, "BT get adapter has error:" + error.name);
  finish();
};

req2.onsuccess = function () {
  var adapter = req2.result;
  isnot(adapter, null, "BT should not be null");

  ok(adapter instanceof BluetoothAdapter, "BT adapter interface should be BluetoothAdapter");
  is(adapter.address, kBDAddress, "BD address not match");
  is(adapter.name, kName, "Name not match");
  is(adapter.discoverable, false, "attr 'discoverable' not match");
  is(adapter.discovering, false, "attr 'discovering' not match");
  // outsider check
  (makeMatchFunc(tester2, "addr", adapter.address,
    makeMatchFunc(tester2, "name", adapter.name,
      makeMatchFunc(tester2, "discoverable", adapter.discoverable? 1:0,
        makeMatchFunc(tester2, "discovering", adapter.discoverying? 1:0)))))();
};

req2.onerror = function () {
  var error = req2.error;
  ok(false, "BT get adapter has error:" + error.name);
  finish();
};


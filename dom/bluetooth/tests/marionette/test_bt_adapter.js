/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 10000;

var kQemuTimeout = 3000;

var kBDAddress = "56:34:12:00:54:52";
var kName = "Full Android on Emulator";
var kNewName = kName.toUpperCase();
var kDiscoverable = 3;

SpecialPowers.addPermission("bluetooth", true, document);

var req = window.navigator.mozBluetooth.getDefaultAdapter();

var result;

function checkResult() {
  return result !== undefined;
};

function setQemuResult(results) {
  result = results[0];
};

function getBTProp(prop) {
  result = undefined;
  runEmulatorCmd("bt get " + prop, setQemuResult);
};

function makeMatchFunc(prop, expect, callback) {
  return function () {
    getBTProp(prop);
    waitFor(
      function () {
        //log(prop + " - expect:" + expect + ", result: " + result);
        is(expect, result, prop + " not match");
        if (callback) {
          callback();
        } else {
          finish();
        }
      }, checkResult, kQemuTimeout);
  };
};

ok(req, "BT cannot get adapter");
req.onsuccess = function () {
  var adapter = req.result;
  isnot(adapter, null, "BT should not be null");
  ok(adapter instanceof BluetoothAdapter, "BT adapter interface should be BluetoothAdapter");
  is(adapter.address, kBDAddress, "BD address not match");
  is(adapter.name, kName, "Name not match");
  is(adapter.discoverable, false, "attr 'discoverable' not match");
  is(adapter.discovering, false, "attr 'discovering' not match");
  // outsider check
  (makeMatchFunc("addr", adapter.address,
    makeMatchFunc("name", adapter.name,
      makeMatchFunc("discoverable", adapter.discoverable? kDiscoverable:kDiscoverable - 1,
        makeMatchFunc("discovering", adapter.discovering? 1:0)))))();
};

req.onerror = function () {
  var error = req.error;
  ok(false, "BT get adapter has error:" + error.name);
  finish();
};


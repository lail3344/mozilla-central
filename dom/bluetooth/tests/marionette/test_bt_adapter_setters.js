/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 10000;

var kQemuTimeout = 3000;

var kBDAddress = "56:34:12:00:54:52";
var kName = "Full Android on Emulator";

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
        log(prop + " - expect: " + expect + ", result: " + result);
        is(expect, result, prop + " not match");
        if (callback) {
          callback();
        } else {
          finish();        
        }
      }, checkResult, kQemuTimeout);
  };
};

function changeDiscoverable(adapter) {
  is(adapter.discoverable, false, "BT should not be discoverable");
  log("set discoverable: true");
  adapter.setDiscoverable(true);
  setTimeout(function () {
    log("changed discoverable: " + adapter.discoverable);
    is(adapter.discoverable, true, "BT should be discoverable now");
    (makeMatchFunc("discoverable", adapter.discoverable, function() {
        finish();
      }))();
  }, kQemuTimeout);
};


function changeName(adapter) {
  var newName = adapter.name + " - changed";
  var r = adapter.setName(newName);
  log("set name: " + newName);
  r.onsuccess = function () {
    log("changed name: " + adapter.name);
    is(adapter.name, newName);
    // outsider check
    (makeMatchFunc("name", adapter.name, function () {
        changeDiscoverable(adapter);
      }))();
  };
  r.onerror = function () {
    ok(false, "Set adapter name shouldn't fail");
    finish();
  }
};

ok(req, "BT cannot get adapter");
req.onsuccess = function () {
  var adapter = req.result;
  isnot(adapter, null, "BT should not be null");
  // before changes
  is(adapter.name, kName, "Name not match");
  is(adapter.discoverable, false, "attr 'discoverable' not match");
  // change name
  changeName(adapter);
};

req.onerror = function () {
  var error = req.error;
  ok(false, "BT get adapter has error:" + error.name);
  finish();
};


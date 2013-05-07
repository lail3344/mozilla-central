/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 10000;

SpecialPowers.addPermission("bluetooth", true, document);

var req = window.navigator.mozBluetooth.getDefaultAdapter();
var tester = getTester();

function getMatchFunc(prop, expect, next) {
  return function () {
    tester.getBTProp(prop);
    waitFor(
      function () {
        log(prop + " - expect: '" + expect + "', result: '" + tester.get() + "'");
        is(expect, tester.get(), prop + " not match");
        if (next) {
          next();
        } else {
          finish();
        }
      }, tester.isSet.bind(tester), kQemuTimeout);
  };
};

function errFunc() {
  ok(false, "BT set invalid name should never succeed");
  finish();
};

ok(req, "BT cannot get adapter");
req.onsuccess = function () {
  var adapter = req.result;
  var name = adapter.name;


  var checkEmpty = function () {
    log("check empty name");
    (getMatchFunc("name", name,
      // how about null?
      function () {
        changeName(adapter, null,
          errFunc, checkNull);
      }))();
  };
    var checkUndefined = function () {
    // check undefined
    (getMatchFunc("name", name))();
  };

  var checkNull = function () {
    log("check null name");
    (getMatchFunc("name", name,
      // how about undefined?
      function () {
        changeName(adapter, undefined,
          errorFunc, checkUndefined);
      }))();
  };

  isnot(adapter, null, "BT should not be null");

  changeName(adapter, "", errFunc, checkEmpty);
};

req.onerror = function () {
  var error = req.error;
  ok(false, "BT get adapter has error: " + error.name);
  finish();
};
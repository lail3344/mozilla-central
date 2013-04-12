/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 10000;

SpecialPowers.addPermission("bluetooth", true, document);

var req = window.navigator.mozBluetooth.getDefaultAdapter();

ok(req, "BT cannot get adapter");
req.onsuccess = function () {
  var adapter = req.result;
  isnot(adapter, null, "BT should not be null");
  ok(adapter instanceof BluetoothAdapter, "BT adapter interface should be BluetoothAdapter");
  is(adapter.address, "56:34:12:00:54:52", "BD address not match");
  is(adapter.name, "Full Android on Emulator", "Name not match");
  is(adapter.discoverable, false, "attr 'discoverable' not match");
  finish();
};

req.onerror = function () {
  var error = req.error;
  ok(false, "BT get adapter has error:" + error.name);
  finish();
};


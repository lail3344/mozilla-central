/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

MARIONETTE_TIMEOUT = 10000;

SpecialPowers.addPermission("bluetooth", true, document);

for (var p in SpecialPowers) {
  log(p);
}
var bt = window.navigator.mozBluetooth;
ok(bt, "BT not found");
ok(bt instanceof BluetoothManager, "BT has wrong interface");
finish();

/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fake1 = kFakeRemotes[0];
var fake2 = kFakeRemotes[1];
var fake3 = kFakeRemotes[2];

runEmulatorCmd("bt radd " + fake1.addr + "," + fake1.name,
  function () {
    runEmulatorCmd("bt radd " + fake2.addr + "," + fake2.name,
		  function () {
        runEmulatorCmd("bt radd " + fake3.addr + "," + fake3.name,
          function () {
            finish();
          }
        );
      }
    );
  }
);

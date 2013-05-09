# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from marionette_test import MarionetteTestCase
import mozdevice
import os

class TestBTExists(MarionetteTestCase):
    def getJS(self, name):
        return open(os.path.abspath(os.path.join(__file__, os.path.pardir, name + ".js")), 'r')
    def testExist(self):
        result = self.marionette.execute_async_script(self.getJS("test_bt_existence").read())
        self.assertEqual(result["failed"], 0)

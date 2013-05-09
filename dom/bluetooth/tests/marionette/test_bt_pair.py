# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from marionette_test import MarionetteTestCase
import mozdevice
import os
import string

class TestBTPair(MarionetteTestCase):
    def getJSPath(self, name):
        return os.path.abspath(os.path.join(__file__, os.path.pardir, name + ".js"))
    def getJSContent(self, name):
        return open(self.getJSPath(name), 'r').read()
    def setUp(self):
        MarionetteTestCase.setUp(self)
    def tearDown(self):
        #self.marionette.execute_async_script(self.getJSContent("bt_test_clear_remotes"))
        MarionetteTestCase.tearDown(self)
    def testPair(self):
        self.marionette.import_script(self.getJSPath("bt_test_utils"));
       # make sure BT is on at first
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_on"))
        self.assertEqual(result["failed"], 0)

        self.marionette.execute_async_script(self.getJSContent("bt_test_add_remotes"))

        result = self.marionette.execute_async_script(self.getJSContent("test_bt_pair"))
        self.assertEqual(result["failed"], 0)

        # make sure BT is off at the end
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_off"))
        self.assertEqual(result["failed"], 0)


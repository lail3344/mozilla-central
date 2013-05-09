# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from marionette_test import MarionetteTestCase
import mozdevice
import os
import string

class TestBTAdapter(MarionetteTestCase):
    def getJSPath(self, name):
        return os.path.abspath(os.path.join(__file__, os.path.pardir, name + ".js"))
    def getJSContent(self, name):
        return open(self.getJSPath(name), 'r').read()
    def testAdapter(self):
        self.marionette.import_script(self.getJSPath("bt_test_utils"));
       # make sure BT is on at first
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_on"))
        self.assertEqual(result["failed"], 0)
        dev_mgr = mozdevice.DeviceManagerADB()
        dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        out = dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        self.assertNotEqual(-1, string.find(out, "BD Address:"))
        
        # adapter check
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_adapter"))
        self.assertEqual(result["failed"], 0)
        # more than 1 adapter intances
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_2adapters"))
        self.assertEqual(result["failed"], 0)
        # change name & discoverable properties
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_adapter_set_name"));
        self.assertEqual(result["failed"], 0);
        # TODO: will fail!
        #result = self.marionette.execute_async_script(self.getJSContent("test_bt_adapter_set_invalid_name"));
        #self.assertEqual(result["failed"], 0);

        # make sure BT is off at the end        
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_off"))
        self.assertEqual(result["failed"], 0)


from marionette_test import MarionetteTestCase
import mozdevice
import os
import string
import re

class TestBTAdapter(MarionetteTestCase):
    def getJS(self, name):
        return open(os.path.abspath(os.path.join(__file__, os.path.pardir, name + ".js")), 'r').read()
    def testAdapter(self):
        # make sure BT is on at first
        result = self.marionette.execute_async_script(self.getJS("test_bt_on"))
        self.assertEqual(result["failed"], 0)
        dev_mgr = mozdevice.DeviceManagerADB()
        dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        out = dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        self.assertNotEqual(-1, string.find(out, "BD Address:"))
        # adapter check
        result = self.marionette.execute_async_script(self.getJS("test_bt_adapter"))
        self.assertEqual(result["failed"], 0)
        # multiple intances of adapter
        result = self.marionette.execute_async_script(self.getJS("test_bt_adapter"))
        self.assertEqual(result["failed"], 0)
        # change name, discoverable properties
        result = self.marionette.execute_async_script(self.getJS("test_bt_adapter_setters"));
        self.assertEqual(result["failed"], 0);
        # make sure BT is on at the end
        result = self.marionette.execute_async_script(self.getJS("test_bt_off"))
        self.assertEqual(result["failed"], 0)


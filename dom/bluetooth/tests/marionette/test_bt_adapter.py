from marionette_test import MarionetteTestCase
import mozdevice
import os
import string
import re

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
        # multiple intances of adapter
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_2adapters"))
        self.assertEqual(result["failed"], 0)
        # change name, discoverable properties
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_adapter_set_name"));
        self.assertEqual(result["failed"], 0);
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_adapter_set_discoverable"));
        self.assertEqual(result["failed"], 0);
        # make sure BT is on at the end
        result = self.marionette.execute_async_script(self.getJSContent("test_bt_off"))
        self.assertEqual(result["failed"], 0)


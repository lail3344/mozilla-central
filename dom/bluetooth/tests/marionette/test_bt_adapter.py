from marionette_test import MarionetteTestCase
import mozdevice
import os
import string
import re

class TestBTAdapter(MarionetteTestCase):
    def getJS(self, name):
        return open(os.path.abspath(os.path.join(__file__, os.path.pardir, name + ".js")), 'r').read()
    def checkBDAddress(self, words):
        match = re.search("BD Address:\s*([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}\s+", words)
        if match == None:
            return False
        return True
    def testOnOff(self):
        # make sure BT is on at first
        result = self.marionette.execute_async_script(self.getJS("test_bt_on"))
        self.assertEqual(result["failed"], 0)
        dev_mgr = mozdevice.DeviceManagerADB()
        dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        out = dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        self.assertNotEqual(-1, string.find(out, "BD Address:"))
        # adapter check
        result = self.marionette.execute_async_script(self.getJS("test_bt_adapter"))
        # TODO: outsider...
        self.assertTrue(self.checkBDAddress(out))
        self.assertEqual(result["failed"], 0)
        # make sure BT is on at the end
        result = self.marionette.execute_async_script(self.getJS("test_bt_off"))
        self.assertEqual(result["failed"], 0)


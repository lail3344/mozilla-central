from marionette_test import MarionetteTestCase
import mozdevice
import os
import string

class TestBTOnOff(MarionetteTestCase):
    def getJS(self, name):
        return open(os.path.abspath(os.path.join(__file__, os.path.pardir, name + ".js")), 'r').read()
    def testOnOff(self):
        dev_mgr = mozdevice.DeviceManagerADB()
        # make sure BT is off at first
        dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        out = dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        self.assertEqual(-1, string.find(out, "BD Address:"))
        # turn it on
        result = self.turnOnBT()
        self.assertEqual(result["failed"], 0)
        # outsider check: hci attched & up
        out = dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        self.assertNotEqual(-1, string.find(out, "BD Address:"))
        self.assertTrue("UP" in string.split(out))
        # turn it on again: there shouldn't be side effect
        result = self.turnOnBT()
        self.assertEqual(result["failed"], 0)
        # outsider check: hci attached & up
        out = dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        self.assertNotEqual(-1, string.find(out, "BD Address:"))
        self.assertTrue("UP" in string.split(out))
        # turn it off
        result = self.turnOffBT()
        self.assertEqual(result["failed"], 0)
        # outsider check: hci detached & down
        out = dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        self.assertEqual(-1, string.find(out, "BD Address:"))
        # turn it off again: there shouldnn't be side effect
        result = self.turnOffBT()
        self.assertEqual(result["failed"], 0)
        # outsider check: hci detached & down
        out = dev_mgr._runCmd(["shell", "hciconfig"]).stdout.read()
        self.assertEqual(-1, string.find(out, "BD Address:"))
    def turnOnBT(self):
        return self.marionette.execute_async_script(self.getJS("test_bt_on"))
    def turnOffBT(self):
        return self.marionette.execute_async_script(self.getJS("test_bt_off"))


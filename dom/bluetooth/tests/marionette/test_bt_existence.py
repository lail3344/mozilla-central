from marionette_test import MarionetteTestCase
import mozdevice
import os

class TestBTExists(MarionetteTestCase):
    def getJS(self, name):
        return open(os.path.abspath(os.path.join(__file__, os.path.pardir, name + ".js")), 'r')
    def testExist(self):
        result = self.marionette.execute_async_script(self.getJS("test_bt_existence").read())
        self.assertEqual(result["failed"], 0)

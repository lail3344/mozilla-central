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

import { expect } from "chai";
import { onStateChangedEmitter } from "../../events/onStateChangedEmitter";
import { State } from "../../binary/state";
import { getStatusBarData } from "../../statusBar/statusBar";

suite("Status bar tests", () => {
  test("Should change status bar data to 'Failed' when state request returns failure and then get back to 'Ok'", () => {
    onStateChangedEmitter.fire({
      cloud_connection_health_status: "Failed",
    } as State);

    expect(
      getStatusBarData()?.cloudConnectionHealthStatus
    ).to.be.shallowDeepEqual("Failed");

    onStateChangedEmitter.fire({
      cloud_connection_health_status: "Ok",
    } as State);

    expect(
      getStatusBarData()?.cloudConnectionHealthStatus
    ).to.be.shallowDeepEqual("Ok");
  });

  test("Should set status bar data to 'Ok' when state request returns missing cloudConnectionHealthStatus prop", () => {
    onStateChangedEmitter.fire({} as State);

    expect(
      getStatusBarData()?.cloudConnectionHealthStatus
    ).to.be.shallowDeepEqual("Ok");
  });
});

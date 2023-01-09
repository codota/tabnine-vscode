import { expect } from "chai";
import { onStateChangedEmitter } from "../../events/onStateChangedEmitter";
import { State } from "../../binary/state";
import { getStatusBarData } from "../../statusBar/statusBar";

suite("Status bar tests", () => {
  test("Should change status bar health status data from 'Failed' to 'Ok' when state changes", () => {
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

  test("Should change status bar health status data from 'Ok' to 'Failed' when state changes", () => {
    onStateChangedEmitter.fire({
      cloud_connection_health_status: "Ok",
    } as State);

    expect(
      getStatusBarData()?.cloudConnectionHealthStatus
    ).to.be.shallowDeepEqual("Ok");

    onStateChangedEmitter.fire({
      cloud_connection_health_status: "Failed",
    } as State);

    expect(
      getStatusBarData()?.cloudConnectionHealthStatus
    ).to.be.shallowDeepEqual("Failed");
  });

  test("Should change service level status bar data when state changes", () => {
    onStateChangedEmitter.fire({
      service_level: "Free",
    } as State);

    expect(getStatusBarData()?.serviceLevel).to.be.shallowDeepEqual("Free");

    onStateChangedEmitter.fire({
      service_level: "Pro",
    } as State);

    expect(getStatusBarData()?.serviceLevel).to.be.shallowDeepEqual("Pro");

    onStateChangedEmitter.fire({
      service_level: "Business",
    } as State);

    expect(getStatusBarData()?.serviceLevel).to.be.shallowDeepEqual("Business");
  });

  test("Should set status bar data to 'Ok' when state request returns missing cloudConnectionHealthStatus prop", () => {
    onStateChangedEmitter.fire({} as State);

    expect(
      getStatusBarData()?.cloudConnectionHealthStatus
    ).to.be.shallowDeepEqual("Ok");
  });
});

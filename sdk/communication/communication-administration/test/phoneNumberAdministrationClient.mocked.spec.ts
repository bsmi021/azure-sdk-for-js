// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { isNode } from "@azure/core-http";
import { assert } from "chai";
import sinon from "sinon";
import {
  GetAreaCodesRequest,
  NumberConfiguration,
  PhoneNumberAdministrationClient,
  PhoneNumberCapabilitiesUpdates
} from "../src";
import { SDK_VERSION } from "../src/phoneNumber/constants";
import { NumberConfigurationPhoneNumber } from "../src/phoneNumber/generated/src/models";
import {
  baseHttpClient,
  getAreaCodesHttpClient,
  getReleaseHttpClient,
  phoneNumbersCapabilitiesHttpClient,
  releasePhoneNumbersHttpClient
} from "./utils/mockHttpClients";
import { TestPhoneNumberAdministrationClient } from "./utils/testPhoneNumberAdministrationClient";

describe("PhoneNumberAdministrationClient [Mocked]", () => {
  const dateHeader = isNode ? "date" : "x-ms-date";

  afterEach(() => {
    sinon.restore();
  });

  it("creates instance of PhoneNumberAdministrationClient", () => {
    const client = new PhoneNumberAdministrationClient(
      "endpoint=https://contoso.spool.azure.local;accesskey=banana"
    );
    assert.instanceOf(client, PhoneNumberAdministrationClient);
  });

  it("sets correct headers", async () => {
    const client = new TestPhoneNumberAdministrationClient();
    const spy = sinon.spy(baseHttpClient, "sendRequest");

    await client.configurePhoneNumberTest({
      phoneNumber: "+18005551234",
      callbackUrl: "https://callback/"
    });
    sinon.assert.calledOnce(spy);

    const request = spy.getCall(0).args[0];

    if (isNode) {
      assert.equal(request.headers.get("host"), "contoso.spool.azure.local");
    }

    assert.typeOf(request.headers.get(dateHeader), "string");
    assert.isDefined(request.headers.get("authorization"));
    assert.match(
      request.headers.get("authorization") as string,
      /HMAC-SHA256 SignedHeaders=.+&Signature=.+/
    );
  });

  it("sends correct NumberConfiguration in configureNumber request", async () => {
    const client = new TestPhoneNumberAdministrationClient();
    const spy = sinon.spy(baseHttpClient, "sendRequest");

    await client.configurePhoneNumberTest({
      phoneNumber: "+18005551234",
      callbackUrl: "https://callback/"
    });
    sinon.assert.calledOnce(spy);

    const request = spy.getCall(0).args[0];
    const expected: NumberConfiguration = {
      phoneNumber: "+18005551234",
      pstnConfiguration: {
        callbackUrl: "https://callback/"
      }
    };
    assert.deepEqual(JSON.parse(request.body), expected);
  });

  it("sends correct phone number in unconfigureNumber request", async () => {
    const client = new TestPhoneNumberAdministrationClient();
    const spy = sinon.spy(baseHttpClient, "sendRequest");

    await client.unconfigurePhoneNumberTest("+18005551234");
    sinon.assert.calledOnce(spy);

    const request = spy.getCall(0).args[0];
    const expected: NumberConfigurationPhoneNumber = {
      phoneNumber: "+18005551234"
    };
    assert.deepEqual(JSON.parse(request.body), expected);
  });

  it("sends correct UpdateNumberCapabilitiesRequest in updatePhoneNumbersCapabilities request", async () => {
    const client = new TestPhoneNumberAdministrationClient();
    const spy = sinon.spy(phoneNumbersCapabilitiesHttpClient, "sendRequest");
    const phoneNumberCapabilitiesUpdate: PhoneNumberCapabilitiesUpdates = {
      "+18005551234": { add: ["Calling"], remove: ["Office365"] }
    };
    const response = await client.updatePhoneNumberCapabilitiesTest(phoneNumberCapabilitiesUpdate);

    assert.equal(response.capabilitiesUpdateId, "1");
    sinon.assert.calledOnce(spy);

    const request = spy.getCall(0).args[0];
    assert.deepEqual(JSON.parse(request.body), { phoneNumberCapabilitiesUpdate });
  });

  it("sends capabilitiesUpdateId in url of getCapabilitiesUpdate request", async () => {
    const client = new TestPhoneNumberAdministrationClient();
    const capabilitiesUpdateId = "1";
    const spy = sinon.spy(phoneNumbersCapabilitiesHttpClient, "sendRequest");
    const response = await client.getCapabilitiesUpdateTest(capabilitiesUpdateId);

    assert.equal(response.capabilitiesUpdateId, capabilitiesUpdateId);
    sinon.assert.calledOnce(spy);

    const request = spy.getCall(0).args[0];
    assert.equal(
      request.url,
      `https://contoso.spool.azure.local/administration/phonenumbers/capabilities/${capabilitiesUpdateId}?api-version=${SDK_VERSION}`
    );
  });

  it("sends list of phone numbers in releasePhoneNumbers request", async () => {
    const client = new TestPhoneNumberAdministrationClient();
    const phoneNumbers = ["+18005551234", "+1800555555"];
    const spy = sinon.spy(releasePhoneNumbersHttpClient, "sendRequest");
    const response = await client.releasePhoneNumbersTest(phoneNumbers);

    assert.equal(response.releaseId, "1");
    sinon.assert.calledOnce(spy);

    const request = spy.getCall(0).args[0];
    assert.deepEqual(JSON.parse(request.body), { phoneNumbers });
  });

  it("sends the releaseId in the url of getRelease request", async () => {
    const client = new TestPhoneNumberAdministrationClient();
    const releaseId = "1";
    const spy = sinon.spy(getReleaseHttpClient, "sendRequest");
    const response = await client.getReleaseTest(releaseId);

    assert.equal(response.releaseId, releaseId);
    assert.equal(response.status, "Complete");
    sinon.assert.calledOnce(spy);

    const request = spy.getCall(0).args[0];
    assert.equal(
      request.url,
      `https://contoso.spool.azure.local/administration/phonenumbers/releases/${releaseId}?api-version=${SDK_VERSION}`
    );
  });

  it("sends location type, country code & phone plan id in url of getAreaCodes request", async () => {
    const client = new TestPhoneNumberAdministrationClient();
    const searchRequest: GetAreaCodesRequest = {
      locationType: "locationType",
      countryCode: "US",
      phonePlanId: "phonePlanId",
      locationOptionsQueries: {
        locationOptions: [
          { labelId: "state", optionsValue: "CA" },
          { labelId: "city", optionsValue: "NOAM-US-CA-LA" }
        ]
      }
    };
    const spy = sinon.spy(getAreaCodesHttpClient, "sendRequest");
    const response = await client.getAreaCodesTest(searchRequest);

    assert.equal(response.primaryAreaCodes?.length, 2);
    assert.equal(response.secondaryAreaCodes?.length, 1);
    sinon.assert.calledOnce(spy);

    const request = spy.getCall(0).args[0];
    assert.equal(
      request.url,
      `https://contoso.spool.azure.local/administration/phonenumbers/countries/${searchRequest.countryCode}/areacodes?locationType=${searchRequest.locationType}&phonePlanId=${searchRequest.phonePlanId}&api-version=${SDK_VERSION}`
    );
  });
});

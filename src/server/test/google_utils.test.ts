// import { User, IDP } from "../../../src/common/types";

import { loginWithGoogleIdToken } from "../google_utils";
import { cleanPools } from "../parlour_db";
import { deleteTestData } from "../../../db/test/helper";
import { google } from "googleapis";

const TEST_EXP_TOKEN =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6ImZiOGNhNWI3ZDhkOWE1YzZjNjc4ODA3MWU4NjZjNmM0MGYzZmMxZjkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjM2NTM3NzQ5Mzc4LXB1bGlqNmoyNzJrZDNnY3MxM2hsanR1OWs5Mjgza2h0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjM2NTM3NzQ5Mzc4LXB1bGlqNmoyNzJrZDNnY3MxM2hsanR1OWs5Mjgza2h0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE2OTkzOTQ4MjY5MTg2MjM3MzExIiwiZW1haWwiOiJkYmlhZ2luaUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6Ik9UNzJvNDdwblFWVEI0WVVFSzVST1EiLCJuYW1lIjoiRGFuIEJpYWdpbmkiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FPaDE0R2lHckJYSUhKcmcxTlhLMXJEalVyU1NCMWVXUksySWtNSWpmZ09pRWc9czk2LWMiLCJnaXZlbl9uYW1lIjoiRGFuIiwiZmFtaWx5X25hbWUiOiJCaWFnaW5pIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE1OTExMzgzNTcsImV4cCI6MTU5MTE0MTk1NywianRpIjoiNGFiMWMyZmFiNTkxZmEwZjRiOTI0NWU5YmE5OWI0YTMwMjRjMWNkOCJ9.tQxVfjt_VWVUsPzxBJie_LNtu1nXGci4yKwmW69lwTPJzlLkPjPrdwX3R9c0ZkyISpHbe8_3UtmMGxzn0URdWfob2p1CbOTJr64cbPuR1I_zI99VaYMuPQi8VbGEz4x8kWhR_WllEtMqqr1DE4f1oRH7IhFcvMhJPtAl0e59rbpZlq2xoLlnj9ncJZAXehoXYWBhgW-HXpJx173QdWQy_ARO9VDkIL-wcwL94GU4oxE2aSl1x56SiWiiWHJF1Y56FPFpZCdNq0bpQqHCbpfE0iNiBdrC1pBYP-JW2QGJ8BV3WTiCJoU-nm1TMCfgPGTK5cKh_Oi6ivDTyyp-JYR77g";

const TEST_NOT_GOOGLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsImtpZCI6ImZiOGNhNWI3ZDhkOWE1YzZjNjc4ODA3MWU4NjZjNmM0MGYzZmMxZjkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjM2NTM3NzQ5Mzc4LXB1bGlqNmoyNzJrZDNnY3MxM2hsanR1OWs5Mjgza2h0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjM2NTM3NzQ5Mzc4LXB1bGlqNmoyNzJrZDNnY3MxM2hsanR1OWs5Mjgza2h0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE2OTkzOTQ4MjY5MTg2MjM3MzExIiwiZW1haWwiOiJkYmlhZ2luaUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6Ik9UNzJvNDdwblFWVEI0WVVFSzVST1EiLCJuYW1lIjoiRGFuIEJpYWdpbmkiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FPaDE0R2lHckJYSUhKcmcxTlhLMXJEalVyU1NCMWVXUksySWtNSWpmZ09pRWc9czk2LWMiLCJnaXZlbl9uYW1lIjoiRGFuIiwiZmFtaWx5X25hbWUiOiJCaWFnaW5pIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE1OTExMzgzNTcsImV4cCI6MTk5MTE0MTk1NywianRpIjoiNGFiMWMyZmFiNTkxZmEwZjRiOTI0NWU5YmE5OWI0YTMwMjRjMWNkOCJ9._3MQeAMa5ab7G16bY2ZytNDbg8DWAfaqjVaqSO1I53U";

afterAll(async () => {
  return cleanPools();
});

beforeAll(async () => {
  await deleteTestData();
});

describe("google login", () => {
  it("rejects expired but valid authentication via id_token", () => {
    // google.GoogleApis.auth.OAuth2.verifyIdToken.mockImplementation(() => {
    //   throw new Error("Token used too late,");
    // });
    expect(loginWithGoogleIdToken(TEST_EXP_TOKEN)).rejects.toThrowError(
      "Token used too late,"
    );
  });

  it("rejects w/ not google signature in id_token", () => {
    expect(loginWithGoogleIdToken(TEST_NOT_GOOGLE_TOKEN)).rejects.toThrowError(
      "Invalid token signature"
    );
  });
});

import { app } from "../main";
import { cleanPools } from "../parlour_db";
import { createUsers, deleteTestData } from "../../../db/test/helper";
import { agent as request } from "supertest";

beforeAll(async () => {
  await deleteTestData();
  await createUsers(10);
});

afterAll(async () => {
  await cleanPools();
});

describe("Auth APIs", () => {
  it("returns 404 when no token received", async () => {
    const res = await request(app).get("/auth/google");
    expect(res.status).toBe(404);
  });
});

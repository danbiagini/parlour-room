import { app } from "../main";
import { cleanPools } from "../parlour_db";
import { createUsers, deleteTestData } from "../../../db/test/helper";
import { agent as request } from "supertest";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await deleteTestData();
  await createUsers(10);
});

afterAll(async () => {
  await cleanPools();
});

describe("Auth APIs", () => {
  it("can authenticate a registered user", async () => {
    const res = await request(app).get("/auth/google");
    expect(res.status).toBe(200);
  });
});

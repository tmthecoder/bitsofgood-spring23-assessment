import app from "../api/endpoints";
import request from "supertest";

let token: string | undefined;

beforeAll(async () => {
  const result = await request(app).post("/api/user/verify").send({
    email: "tejas@tmthecoder.dev",
    password: "some-password",
  });
  token = result.body["token"];
});

describe("POST - /api/animal", () => {
  test("Unauthorized creation", async () => {
    const result = await request(app).post("/api/animal").send({});
    expect(result.statusCode).toEqual(401);
  });

  test("Create with no body", async () => {
    const result = await request(app)
      .post("/api/animal")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(result.statusCode).toEqual(400);
  });

  test("Create with malformed body", async () => {
    const result = await request(app)
      .post("/api/animal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Animal 0",
        dateOfBirth: "incorrect-dob",
      });
    expect(result.statusCode).toEqual(400);
  });

  test("Create with correct body", async () => {
    const result = await request(app)
      .post("/api/animal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Animal 0",
        dateOfBirth: "2023-01-10",
      });
    expect(result.statusCode).toEqual(200);
  });
});

describe("GET - /api/admin/animals", () => {
  const animalArray: any[] = [];
  // Setup a bunch of animals for lookup
  beforeAll(async () => {
    for (let i = 0; i < 50; i++) {
      animalArray.push({
        name: `Animal ${i}`,
        dateOfBirth: "2023-01-10",
      });
    }
    for (let i = 1; i < 50; i++) {
      await request(app)
        .post("/api/animal")
        .set("Authorization", `Bearer ${token}`)
        .send(animalArray[i]);
    }
  });
  let lastId: string | undefined;
  test("Check if api returns 1st 10 animals", async () => {
    const page = await request(app)
      .get("/api/admin/animals")
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(page.statusCode).toEqual(200);
    for (let i = 0; i < 10; i++) {
      expect(page.body["data"][i]["name"]).toEqual(animalArray[i]["name"]);
    }
    lastId = page.body["lastId"];
  });
  test("Check the next page to test pagination", async () => {
    const page = await request(app)
      .get(`/api/admin/animals?lastId=${lastId}`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(page.statusCode).toEqual(200);
    for (let i = 10; i < 19; i++) {
      expect(page.body["data"][i - 10]["name"]).toEqual(animalArray[i]["name"]);
    }
  });
  test("Check passing in a larger page size", async () => {
    const page = await request(app)
      .get(`/api/admin/animals?lastId=${lastId}&size=20`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(page.statusCode).toEqual(200);
    for (let i = 10; i < 29; i++) {
      expect(page.body["data"][i - 10]["name"]).toEqual(animalArray[i]["name"]);
    }
  });
});

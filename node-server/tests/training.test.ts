import app from "../api/endpoints";
import request from "supertest";

let token: string | undefined;
let correctOwnerAnimalID: string | undefined;
let wrongOwnerAnimalID: string | undefined;

beforeAll(async () => {
  const result = await request(app).post("/api/user/verify").send({
    email: "tejas@tmthecoder.dev",
    password: "some-password",
  });
  token = result.body["token"];

  const correctAnimalResult = await request(app)
    .post("/api/animal")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Animal With Correct Owner",
      dateOfBirth: "2023-01-10",
    });
  correctOwnerAnimalID = correctAnimalResult.body["_id"];

  const authResult = await request(app).post("/api/user/verify").send({
    email: "tejas1@tmthecoder.dev",
    password: "some-password",
  });
  const otherToken = authResult.body["token"];

  const wrongAnimalResult = await request(app)
    .post("/api/animal")
    .set("Authorization", `Bearer ${otherToken}`)
    .send({
      name: "Animal With Incorrect Owner",
      dateOfBirth: "2023-01-10",
    });
  wrongOwnerAnimalID = wrongAnimalResult.body["_id"];
});

describe("POST - /api/training", () => {
  test("Unauthorized creation", async () => {
    const result = await request(app).post("/api/training").send({});
    expect(result.statusCode).toEqual(401);
  });

  test("Create with no body", async () => {
    const result = await request(app)
      .post("/api/training")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(result.statusCode).toEqual(400);
  });

  test("Create with malformed body", async () => {
    const result = await request(app)
      .post("/api/training")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2023-01-10",
        description: "some description",
        hours: 10,
        animal: "not-an-object-id",
      });
    expect(result.statusCode).toEqual(400);
  });

  test("Create with incorrect user", async () => {
    const result = await request(app)
      .post("/api/training")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2023-01-10",
        description: "some description",
        hours: 10,
        animal: wrongOwnerAnimalID,
      });
    expect(result.statusCode).toEqual(400);
  });

  test("Create with correct body", async () => {
    const result = await request(app)
      .post("/api/training")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2023-01-10",
        description: "some description 0",
        hours: 10,
        animal: correctOwnerAnimalID,
      });
    expect(result.statusCode).toEqual(200);
  });
});

describe("GET - /api/admin/training", () => {
  const trainingArray: any[] = [];
  // Setup a bunch of training logs for lookups
  beforeAll(async () => {
    for (let i = 0; i < 50; i++) {
      trainingArray.push({
        date: "2023-01-10",
        description: `some description ${i}`,
        hours: 10,
        animal: correctOwnerAnimalID,
      });
    }
    for (let i = 1; i < 50; i++) {
      await request(app)
        .post("/api/training")
        .set("Authorization", `Bearer ${token}`)
        .send(trainingArray[i]);
    }
  });
  let lastId: string | undefined;
  test("Check if api returns 1st 10 animals", async () => {
    const page = await request(app)
      .get("/api/admin/training")
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(page.statusCode).toEqual(200);
    for (let i = 0; i < 10; i++) {
      expect(page.body["data"][i]["description"]).toEqual(
        trainingArray[i]["description"]
      );
    }
    lastId = page.body["lastId"];
  });
  test("Check the next page to test pagination", async () => {
    const page = await request(app)
      .get(`/api/admin/training?lastId=${lastId}`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(page.statusCode).toEqual(200);
    for (let i = 10; i < 19; i++) {
      expect(page.body["data"][i - 10]["description"]).toEqual(
        trainingArray[i]["description"]
      );
    }
  });
  test("Check passing in a larger page size", async () => {
    const page = await request(app)
      .get(`/api/admin/training?lastId=${lastId}&size=20`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(page.statusCode).toEqual(200);
    for (let i = 10; i < 29; i++) {
      expect(page.body["data"][i - 10]["description"]).toEqual(
        trainingArray[i]["description"]
      );
    }
  });
});

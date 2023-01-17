import { ObjectID } from "bson";
import { Request, Response } from "express";
import {
  Animal,
  animalSchema,
  TrainingLog,
  trainingLogSchema,
  User,
  userSchema,
} from "../types";
import { getConnection } from "./dbConnector";
import { getAnimalWithId, getUserWithId } from "./getItems";

type ItemWithPath =
  | { path: "animals"; data: Animal }
  | { path: "users"; data: User }
  | { path: "trainingLogs"; data: TrainingLog };

export async function handleAddUserRequest(req: Request, res: Response) {
  const result = await userSchema.safeParseAsync(await req.body);
  if (!result.success) {
    res.status(400).send(result.error.flatten().fieldErrors);
    return;
  }
  const user = result.data;
  await genericAPIAdd(res, {
    path: "users",
    data: user,
  });
}

export async function handleAddAnimalRequest(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).send();
    return;
  }
  // Set owner from the decoded JWT info
  const body = await req.body;
  const animalBody = {
    ...body,
    owner: req.user._id,
    hoursTrained: 0,
  };
  const result = animalSchema.safeParse(animalBody);
  if (!result.success) {
    res.status(400).send(result.error.flatten().fieldErrors);
    return;
  }
  const animals = result.data;
  await genericAPIAdd(res, {
    path: "animals",
    data: animals,
  });
}

export async function handleAddTrainingLogRequest(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).send();
    return;
  }
  // Set associated user with the decoded JWT info
  const body = req.body;
  const trainingLogBody = {
    ...body,
    user: req.user._id,
  };
  const result = trainingLogSchema.safeParse(trainingLogBody);
  if (!result.success) {
    res.status(400).send(result.error.flatten().fieldErrors);
    return;
  }
  const trainingLog = result.data;

  // Get associated animal and make sure animal's owner is this user
  const associatedUser = await getUserWithId(trainingLog.user);
  const associatedAnimal = await getAnimalWithId(trainingLog.animal);
  if (!associatedUser || !associatedAnimal) {
    res.status(400).send({
      error: "The animal or user associated with the log does not exist",
    });
    return;
  }

  if (associatedAnimal.owner != associatedUser._id) {
    res.status(400).send({
      error: "The animal is not owned by the user associated with the log",
    });
    return;
  }

  // Update the animal's hours trained with the hours in this log
  await updateAnimalHoursTrained(
    associatedAnimal._id,
    associatedAnimal.hoursTrained + trainingLog.hours
  );
  await genericAPIAdd(res, {
    path: "trainingLogs",
    data: trainingLog,
  });
}

async function updateAnimalHoursTrained(id: ObjectID, hours: number) {
  const db = await getConnection();
  if (!db) throw new Error("Database connection failed");
  await db
    .collection("animals")
    .updateOne({ _id: id }, { $set: { hoursTrained: hours } });
}

async function genericAPIAdd(res: Response, item: ItemWithPath) {
  try {
    const userWithId = await addItem(item);
    res.json(userWithId).send();
  } catch (error) {
    res.status(500).send(`Internal error: ${error}`);
  }
}

async function addItem(item: ItemWithPath) {
  const db = await getConnection();
  if (!db) throw new Error("Database connection failed");
  const result = await db.collection(item.path).insertOne(item.data);
  return {
    _id: result.insertedId,
    ...item.data,
  };
}

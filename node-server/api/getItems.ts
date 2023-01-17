import { Response } from "express";
import { ObjectId } from "mongodb";
import {
  AdminRequest,
  AnimalWithID,
  TrainingLogWithID,
  UserWithId,
} from "../types";
import { getConnection } from "./dbConnector";

export async function handleAdminGetUsers(req: AdminRequest, res: Response) {
  if (!req.user) {
    res.status(401).send();
    return;
  }
  const size = parseInt(req.query.size ?? "10");
  const lastId = req.query.lastId;
  const list = await getListOfUsers(size, lastId);
  res
    .json({
      data: list,
      lastId: list.at(list.length - 1)?._id,
    })
    .send();
}

export async function handleAdminGetAnimals(req: AdminRequest, res: Response) {
  if (!req.user) {
    res.status(401).send();
    return;
  }
  const size = parseInt(req.query.size ?? "10");
  const lastId = req.query.lastId;
  const list = await getListOfAnimals(size, lastId);
  res
    .json({
      data: list,
      lastId: list.at(list.length - 1)?._id,
    })
    .send();
}

export async function handleAdminGetTrainingLogs(
  req: AdminRequest,
  res: Response
) {
  if (!req.user) {
    res.status(401).send();
    return;
  }
  const size = parseInt(req.query.size ?? "10");
  const lastId = req.query.lastId;
  const list = await getListOfTrainingLogs(size, lastId);
  res
    .json({
      data: list,
      lastId: list.at(list.length - 1)?._id,
    })
    .send();
}

export async function getUserWithId(id: ObjectId) {
  const result = await getItemWithId("users", id);
  return result as UserWithId | null;
}

export async function getAnimalWithId(id: ObjectId) {
  const result = await getItemWithId("animals", id);
  return result as AnimalWithID | null;
}

export async function getTrainingLogWithId(id: ObjectId) {
  const result = await getItemWithId("trainingLogs", id);
  return result as TrainingLogWithID | null;
}

async function getItemWithId(collection: string, id: ObjectId) {
  const db = await getConnection();
  if (!db) throw new Error("Database connection failed");
  return await db.collection(collection).findOne({ _id: new ObjectId(id) });
}

async function getListOfUsers(size: number, lastId?: string) {
  const result = await getListOfItems("users", size, lastId);
  return result as UserWithId[];
}

async function getListOfAnimals(size: number, lastId?: string) {
  const result = await getListOfItems("animals", size, lastId);
  return result as UserWithId[];
}

async function getListOfTrainingLogs(size: number, lastId?: string) {
  const result = await getListOfItems("trainingLogs", size, lastId);
  return result as UserWithId[];
}

async function getListOfItems(
  collection: string,
  size: number,
  lastId?: string
) {
  const db = await getConnection();
  if (!db) throw new Error("Database connection failed");
  if (lastId) {
    return db
      .collection(collection)
      .find({ _id: { $gt: new ObjectId(lastId) } })
      .limit(size)
      .toArray();
  } else {
    return db.collection(collection).find().limit(size).toArray();
  }
}

export async function getUserWithEmail(email: string) {
  const db = await getConnection();
  if (!db) throw new Error("Database connection failed");
  const result = await db.collection("users").findOne({ email: email });
  return result as UserWithId | null;
}

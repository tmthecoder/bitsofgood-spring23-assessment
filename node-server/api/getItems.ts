import { ObjectId } from "mongodb";
import { AnimalWithID, TrainingLogWithID, UserWithId } from "../types";
import { getConnection } from "./dbConnector"

export async function getUserWithId(id: ObjectId) {
    const result = await getItemWithId('users', id);
    return result as UserWithId | null;
}

export async function getAnimalWithId(id: ObjectId) {
    const result = await getItemWithId('animals', id);
    return result as AnimalWithID | null;
}

export async function getTrainingLogWithId(id: ObjectId) {
    const result = await getItemWithId('trainingLogs', id);
    return result as TrainingLogWithID | null;
}

async function getItemWithId(collection: string, id: ObjectId) {
    const db = await getConnection()
    if (!db) throw new Error("Database connection failed")
    return await db.collection(collection).findOne({ '_id': new ObjectId(id) });
}

export async function getListOfUsers(size: number, lastId?: string) {
    const result = await getListOfItems('users', size, lastId);
    return result as UserWithId[];
}

export async function getListOfAnimals(size: number, lastId?: string) {
    const result = await getListOfItems('animals', size, lastId);
    return result as UserWithId[];
}

export async function getListOfTrainingLogs(size: number, lastId?: string) {
    const result = await getListOfItems('trainingLogs', size, lastId);
    return result as UserWithId[];
}

async function getListOfItems(collection: string, size: number, lastId?: string) {
    const db = await getConnection();
    if (!db) throw new Error("Database connection failed");
    if (lastId) {
        return db.collection(collection).find({ '_id': { '$gt': new ObjectId(lastId) } }).limit(size).toArray()
    } else {
        return db.collection(collection).find().limit(size).toArray()
    }
}

export async function getUserWithEmail(email: string) {
    const db = await getConnection()
    if (!db) throw new Error("Database connection failed")
    const result = await db.collection('users').findOne({ email: email });
    return result as UserWithId | null;
}

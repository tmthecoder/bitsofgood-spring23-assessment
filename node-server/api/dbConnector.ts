import { Db, MongoClient } from "mongodb";

// Connection URI
const uri =
    "mongodb://localhost:27017";
// Create a new MongoClient
const client = new MongoClient(uri);

let dbConnection: Db | undefined;

export async function connectToDB() {
    const connection = await client.connect()
    dbConnection = connection.db("animalTrainingManagement")
}

export async function getConnection() {
    if (!dbConnection) await connectToDB()
    return dbConnection;
}

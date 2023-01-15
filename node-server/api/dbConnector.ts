import { Db, MongoClient } from "mongodb";

// Create a new MongoClient
const client = new MongoClient(process.env.MONGO_URL!);

let dbConnection: Db | undefined;

export async function connectToDB() {
    const connection = await client.connect()
    dbConnection = connection.db(process.env.MONGO_DATABASE)
}

export async function getConnection() {
    if (!dbConnection) await connectToDB()
    return dbConnection;
}

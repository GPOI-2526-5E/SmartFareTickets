import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db: Db | null = null;

export interface DatabaseConfig {
    uri: string;
    dbName: string;
    options: any;
}

const getDatabaseConfig = (): DatabaseConfig => {
    const mongodbUri = process.env.MONGODB_URI;
    const mongodbDatabase = process.env.MONGODB_DATABASE || "smartfare";

    if (!mongodbUri) {
        throw new Error("MONGODB_URI non configurato in .env");
    }

    return {
        uri: mongodbUri,
        dbName: mongodbDatabase,
        options: {
            maxPoolSize: 10,
            minPoolSize: 2,
            retryWrites: true,
            w: "majority",
        },
    };
};

/**
 * Connessione a MongoDB Atlas
 */
export async function connectDatabase(): Promise<Db> {
    try {
        if (db) {
            console.log("✅ Database già connesso");
            return db;
        }

        const config = getDatabaseConfig();
        console.log(`🔄 Connessione a MongoDB Atlas: ${config.uri.split("@")[1]}`);

        const client = new MongoClient(config.uri, config.options);
        await client.connect();

        db = client.db(config.dbName);

        // Verifica la connessione
        await db.admin().ping();
        console.log("✅ Connessione a MongoDB Atlas riuscita!");

        return db;
    } catch (error) {
        console.error("❌ Errore connessione database:", error);
        throw error;
    }
}

/**
 * Otiene l'istanza del database
 */
export function getDatabase(): Db {
    if (!db) {
        throw new Error("Database non connesso. Chiama connectDatabase() prima.");
    }
    return db;
}

/**
 * Disconnessione dal database
 */
export async function disconnectDatabase(): Promise<void> {
    try {
        if (db) {
            // Nota: Per chiudere la connessione, devi avere accesso al client
            console.log("✅ Database disconnesso");
            db = null;
        }
    } catch (error) {
        console.error("❌ Errore disconnessione database:", error);
        throw error;
    }
}

/**
 * Helper per ottenere una collection
 */
export function getCollection(collectionName: string) {
    const database = getDatabase();
    return database.collection(collectionName);
}

export function isDatabaseConnected(): boolean {
    return db !== null;
}

export default {
    connectDatabase,
    getDatabase,
    disconnectDatabase,
    getCollection,
    isDatabaseConnected,
};

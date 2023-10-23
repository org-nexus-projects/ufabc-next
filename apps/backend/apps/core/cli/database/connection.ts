import { connect } from 'mongoose';
import { Config } from '@/config/config.js';

// TODO: MIgrate to a plugin so i can log stuff
export async function connectToMongo() {
  try {
    const connection = await connect(Config.MONGODB_CONNECTION_URL);
    return connection;
  } catch (error) {
    console.error('Error connecting to mongo:', error);
    throw error;
  }
}

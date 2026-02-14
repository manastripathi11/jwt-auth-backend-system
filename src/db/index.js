import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {    // this async function returns a promise
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected to DB Host : ${connectionInstance.connection.host} \n`);
    } catch (error) {
        console.log('Error connecting to the database:', error);
        process.exit(1);  //Node.js ko forcefully band kar do, 1 = error ke saath exit hua
    }
}

export default connectDB;
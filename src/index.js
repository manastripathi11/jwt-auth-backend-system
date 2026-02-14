import dotenv from 'dotenv'   // generally require() is used, but here we use import
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({ path: './env' })

connectDB()    // because async function returns a promise
.then( () => {
    app.listen( process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    } );
    app.on("error", (error) => {
        console.error('Server error:', error);
    } );
} )
.catch( (error) => {
    console.error('Failed to connect to the database:', error);
} );
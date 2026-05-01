const mongoose = require('mongoose')

const connectDB = async () =>
    {
        try{
            const conn = await mongoose.connect(process.env.MONGO_URI.{

                
                useCreateIndex: true,
            });
            console.log(`MongoDB connected: ${conn} `)
        }
        catch(error)
        {
            console.error(`Error: ${error.message}`);
            process.exit();
        }
    }

    module.exports = connectDB;
const { MongoClient } = require("mongodb")

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
// const db = 'quotesBlog';
// const collection = 'posts';

let database = {

    createOneDocument: async function(newDocument, db, collection){      
        try {
            await client.connect();
            const result = await client.db(db).collection(collection).insertOne(newDocument);
            return result.insertedId;

        }catch (e){
            console.error(e);
        }finally{
            await client.close();
        }   
    },

    findOneDocument: async function(queryObj={}, db, collection){
      try {
            await client.connect();
            const result = await client.db(db).collection(collection).findOne(queryObj);
        
            console.log('log inside findOne' , result);
            return result;
            
        }catch (e){
            console.error(e);
        }finally{
            await client.close();
        }
    },

    findManyDocuments: async function(pageNumber=0, limit=5, db, collection){
        try {
            await client.connect();
            const cursor = await client.db(db).collection(collection).find().limit(limit).sort({_id:-1}).skip(pageNumber*limit);
        
            const result = await cursor.toArray();
            console.log('log inside findMany()' , result);
            return result;
            
        }catch (e){
            console.error(e);
        }finally{
            await client.close();
        }
    },

    deleteOneDocument: async function(queryObj = {}, db, collection){
        try {
            await client.connect();
            const result = await client.db(db).collection(collection).deleteOne(queryObj);

            console.log(`${result.deletedCount} Document/s deleted`);
            
        }catch (e){
            console.error(e);
        }finally{
            await client.close();
        }
    },

    testFunction: function(){
        console.log('Testing @QuotesBlog/database.js');
    }
}


module.exports = {database};
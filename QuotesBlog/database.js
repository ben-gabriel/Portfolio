const res = require("express/lib/response");
const { MongoClient } = require("mongodb")

const uri = process.env.MONGODB_URI_BLOG;
const client = new MongoClient(uri);
// const db = 'quotesBlog';
// const collection = 'posts';

let database = {

    createOneDocument: async function(newDocument, db, collection){      
        try {
            await client.connect();
            const result = await client.db(db).collection(collection).insertOne(newDocument);
            console.log('\n[database.js] createOne() =' , result,'\n');
            return result.insertedId;

        }catch (e){
            console.error(e);
        }finally{
            await client.close();
        }   
    },

    updateOneDocument: async function(queryObj={}, insertObj, db, collection, incObj){
        try {
            await client.connect();
            let result;
            if(incObj){
                console.log('\n[database.js] updateOneDocument() {IF} \n');
                result = await client.db(db).collection(collection).updateOne(queryObj, {$set: insertObj,$inc:incObj});
            }
            else{
                console.log('\n[database.js] updateOneDocument() {ELSE} \n');
                result = await client.db(db).collection(collection).updateOne(queryObj, {$set: insertObj});
            }

            console.log('\n[database.js] updateOneDocument() =',result,'\n');
            return result;

        }catch (e){
            console.error(e);
        }finally{
            await client.close()
        }
    },

    pushToDocument: async function(queryObj={}, insertObj, db, collection, incObj){
        try {
            await client.connect();
            let result;
            if(incObj){
                console.log('\n[database.js] pushToDocument() {IF} \n');
                result = await client.db(db).collection(collection).updateOne(queryObj, {$push: insertObj,$inc:incObj});
            }
            else{
                console.log('\n[database.js] pushToDocument() {ELSE} \n');
                result = await client.db(db).collection(collection).updateOne(queryObj, {$push: insertObj});
            }

            console.log('\n[database.js] pushToDocument() =',result,'\n');
            return result;

        }catch (e){
            console.error(e);
        }finally{
            await client.close()
        }
    },

    pullFromDocument:async function(queryObj={}, removeObj, db, collection, incObj){
        try {
            await client.connect();
            let result;
            if(incObj){
                console.log('\n[database.js] pullFromDocument() {IF} \n');
                result = await client.db(db).collection(collection).updateOne(queryObj, {$pull: removeObj, $inc: incObj});
            }
            else{
                console.log('\n[database.js] pullFromDocument() {ELSE} \n');
                result = await client.db(db).collection(collection).updateOne(queryObj, {$pull: removeObj});
            }

            console.log('\n[database.js] pullFromDocument() =',result,'\n');
            return result;
            
        }catch (e){
            console.error(e)
        }finally{
            await client.close();
        }
    },

    findOneDocument: async function(queryObj={}, db, collection){
      try {
            await client.connect();
            const result = await client.db(db).collection(collection).findOne(queryObj);
        
            console.log('\n[database.js] findOne() =' , result,'\n');
            return result;
            
        }catch (e){
            console.error(e);
        }finally{
            await client.close();
        }
    },

    findManyDocuments: async function(queryObj = {}, pageNumber=0, limit=5, db, collection, sortQuery={_id:-1}){
        try {
            await client.connect();
            let cursor;
            if(limit === -1){
                // no limit
                cursor = await client.db(db).collection(collection).find(queryObj).sort(sortQuery).skip(pageNumber*limit);
            }
            else{
                cursor = await client.db(db).collection(collection).find(queryObj).limit(limit).sort(sortQuery).skip(pageNumber*limit);
            }
        
            const result = await cursor.toArray();
            console.log('\n[database.js] findMany() =' , result,'\n');
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
            console.log(`\n[database.js] deleteOne() = ${result.deletedCount} Document/s deleted\n`);
            return result;

        }catch (e){
            console.error(e);
        }finally{
            await client.close();
        }
    },

    testFunction: function(){
        console.log('\nTesting @QuotesBlog/database.js\n');
    }
}


module.exports = {database};
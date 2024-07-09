const client = require('./dataAccess')
const {addCustomer, getCustomerByPhone} = require('./Customer')
const { ObjectId } = require('mongodb')
async function importTransactions(transaction){
    return new Promise(async (resolve, reject)=>{
        addCustomer({
            "Phone Number": transaction["Phone Number"],
            "Name": transaction["Customer Name"],
            "Address": transaction["Address"]
        })
        await client.connect()
        const db = client.db("Final");
        const col = db.collection("Transactions");
        transaction["Date"] = new Date()
        transaction["Invoice"] = {
            "Phone Number": transaction["Phone Number"],
            "Name": transaction["Customer Name"],
            "Address": transaction["Address"],
            "Buy" : transaction["Buy"],
            "total" : transaction["Total"]
        }
        col.insertOne(transaction).then(() => resolve("Successfully imported")).catch((err) => resolve(err))
    })
}

async function getAllTransactions(){
    return new Promise(async(resolve, reject) =>{
        await client.connect()
        const db = client.db("Final");
        const col = db.collection("Transactions");
        col.find({}).toArray().then(transaction => resolve(transaction)).catch(err => reject(err))
    })
}

async function getTransactionByPhoneNumber(phoneNumber){
    return  new Promise(async(resolve, reject) => {
        await client.connect()
        const db = client.db("Final");
        const col = db.collection("Transactions");
        let value = {"Phone Number" : phoneNumber}
        await col.find(value).toArray().then(transaction => resolve(transaction)).catch(err => reject(err))
    })
}

async function getTransactionByID(id){
    return  new Promise(async(resolve, reject) => {
        await client.connect()
        const db = client.db("Final");
        const col = db.collection("Transactions");
        let value = { _id: new ObjectId(id) }
        console.log(value);
        await col.findOne(value).then(transaction => resolve(transaction)).catch(err => reject(err))
    })
}

module.exports = {importTransactions, getAllTransactions, getTransactionByPhoneNumber, getTransactionByID}
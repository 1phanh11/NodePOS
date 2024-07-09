const client = require('./dataAccess')

// add customer
async function addCustomer(Customer) {
  return new Promise(async (resolve, reject) => {
    await client.connect()
    const db = client.db("Final");
    const col = db.collection("Customers");
    col.findOne({ "Phone Number": Customer["Phone Number"] })
    checkCustomer(Customer["Phone Number"])
      .catch(async () => await col.insertOne(Customer).then(() => resolve("Successfully added")))
      .then(() => resolve("Phone was used"))

  })
}

// get inf customer by your phone number
async function getCustomerByPhone(phoneNumber) {
  return new Promise(async (resolve, reject) => {
    await client.connect()
    const db = client.db("Final");
    const col = db.collection("Customers");
    await col.findOne({ "Phone Number": phoneNumber }).then(res => resolve(res)).catch((err) => reject(err))
  });
}

// check customer was in database
async function checkCustomer(PhoneNumber) {
  return new Promise(async (resolve, reject) => {
    await client.connect()
    const db = client.db("Final");
    const col = db.collection("Customers");
    col.findOne({ "Phone Number": PhoneNumber }).then((result) => result !== null ? resolve() : reject()).catch((err) => {
      reject(err)
    })
  })
}

async function employeeGetListCustomer() {
  try {
    await client.connect()
    const db = client.db("Final");
    const col = db.collection("Customers");
    let d = await col.find({}).toArray();
    return d
  }
  catch (err) {
    throw err
  }
}
module.exports = { addCustomer, getCustomerByPhone, employeeGetListCustomer }
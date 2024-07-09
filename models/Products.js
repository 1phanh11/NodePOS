const client = require('./dataAccess')
const { importTransactions, getAllTransactions, getTransactionByPhoneNumber } = require('./Transaction')

async function checkProduct(barcode) {
  return new Promise(async (resolve, reject) => {
    await client.connect()
    const db = client.db("Final");
    const col = db.collection("Products");
    let imValue = { "Barcode": barcode }
    col.find(imValue).toArray().then((product) => {
      if (product.length === 0) { resolve() }
      else {
        reject()
      }
    }).catch((err) => { reject(err) })
  })
}

// Import product
async function productImport(barcode, pName, imPrice, rePrice, catelogy) {
  return new Promise(async (resolve, reject) => {
    checkProduct(barcode).then(async () => {
      let pro = {
        "Barcode": barcode,
        "Product": pName,
        "ImPrice": imPrice,
        "RePrice": rePrice,
        "Catelogy": catelogy,
        "Creation date": new Date()
      }
      await client.connect()
      const db = client.db("Final");
      const col = db.collection("Products");
      const d = await col.insertOne(pro);
      resolve(pro)
    }
    ).catch(err => reject(err))
  })
}

//Update product
async function editProdust(barcode, editedProduct) {
  return new Promise(async (resolve, reject) => {
    await client.connect()
    checkProduct(barcode).catch(async () => {
      const db = await client.db("Final");
      const col = await db.collection("Products");
      let temp = { Barcode: barcode }
      let newValue = { $set: editedProduct }
      await col.updateOne(temp, newValue).then(() => resolve("Updated")).catch(err => reject(err))
    }).then(() => resolve("Don't find product."))
  })
}

// Get a list of products for admin
async function adminGetListProduct() {
  try {
    await client.connect()
    const db = client.db("Final");
    const col = db.collection("Products");
    let d = await col.find({}).toArray();
    return d
  }
  catch (err) {
    throw err
  }
}

// Get a list of products for employee
async function empGetListProduct() {
  return new Promise(async (resolve, reject) => {
    try {
      await client.connect()
      const db = client.db("Final");
      const col = db.collection("Products");
      let d = await col.find({}).toArray();
      const results = d.map(obj => ({
        "Barcode": obj.Barcode,
        "Product": obj.Product,
        "RePrice": obj.RePrice,
        "Catelogy": obj.Catelogy,
        "Creation date": obj["Creation date"]
      }));
      resolve(results)
    }
    catch (err) {
      reject(err)
    }
  })
}
//Get a product by BarCode
async function getProductByBarCode(barCode) {
  return new Promise(async (res, rej) => {
    await client.connect()
    const db = client.db("Final");
    const col = db.collection("Products");
    await col.findOne({ "Barcode": barCode }).then(result => res(result)).catch((err) => rej(err))
  })
}

//Delete a product
async function deleteProduct(barCode){
  return new Promise(async(res, rej)=>{
    await client.connect()
    const db = client.db("Final");
    const col = db.collection("Products");
    const transactions = await getAllTransactions();

    for (const element of transactions) {
      for (const key in element.Buy) {
        if (element.Buy.hasOwnProperty(key)) {
          const item = element.Buy[key];
          if (item.Barcode === barCode) {
            return rej("Can't delete");
          }
        }
      }
    }
    await col.deleteOne({"Barcode": barCode}).then(()=> res("Deleted")).catch((err) => rej(err))
  })
}

module.exports = { productImport, editProdust, adminGetListProduct, empGetListProduct, getProductByBarCode, deleteProduct }
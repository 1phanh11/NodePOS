//const {productImport, empGetListProduct, adminGetListProduct, editProdust} = require('./databaseAccess')
const {productImport, editProdust, adminGetListProduct, empGetListProduct, getProductByBarCode, deleteProduct} = require('./Products')
const {addCustomer, getCustomerByPhone} = require('./Customer')
const {importTransactions, getAllTransactions, getTransactionByPhoneNumber} = require('./Transaction')

// addCustomer({
//     "Phone Number": "123124012",
//     "Name": "Phanh",
//     "Address": "nha be"
// }).then((d) => console.log(d))

// getProductByBarCode("KDJ-KDJ-729").then((d) => console.log(d))

// editProdust("ADC-adc-1151", {"Barcode": "DSA-DSA-536"}).catch(function(rej){console.log(rej)}).then((d) => console.log(d))
// adminGetListProduct().then(function(result){
//     console.log(result)
//     })
// productImport("ADC-adc-1151", "Mirinda", 7000, 12000, "Drink").then(function(result){
//     console.log(result)
//   })

let transsaction = {
    "Customer Name": "Vinh",
    "Phone Number": "1231249124",
    "Address": "Q7",
    "Buy": {
        1 : {"Barcode": "KDJ-KDJ-729", "Name": "Coca", "Price": 13000, "Quantity": 2, "Subtotal": 26000},
        2 : {"Barcode": "DCB-DCB-729", "Name": "Pepsi", "Price": 13000, "Quantity": 1, "Subtotal": 13000}
    },
    "Total" : 39000,
    "Receive": 50000,
    "Repay" : 11000
}

// importTransactions(transsaction).then(async (d) => await console.log(d)).catch((err) => console.log(err))

// getAllTransactions().then((d) => {
//     console.log(d);
    
// }).catch((err) => console.log(err))
// getTransactionByPhoneNumber("1231249124").then((d) => console.log("-----")).catch((err) => console.log(err))

// deleteProduct("DCB-DCB-729").then((d) => console.log(d)).catch((err) => console.log(err))
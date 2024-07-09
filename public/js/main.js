
const customerDataList = [];
const productDataList = [];
// Data barang yang akan tampil di jquery autocomple
// key:label adalah bawaan jquery autocomple, sebaiknya jangan diganti saja
let finalTotal = 0;
let BuyArr = []


$(document).ready(function () {
    let root = window.location.origin
    let UrldataCus = `${root}/employee/dataCustomer`
    // Sử dụng AJAX để lấy dữ liệu từ server
    $.ajax({
        url: UrldataCus, // Đường dẫn tới API endpoint của bạn
        type: 'GET',
        success: function (data) {
            // Khi nhận được dữ liệu từ server
            const select = $('#customer');

            // Loop qua dữ liệu và tạo các option cho select
            data.forEach(function (customer) {
                customerDataList.push(customer)
            });
        },
        error: function (err) {
            console.error(err); // Xử lý lỗi nếu có
        }
    });

    let UrldataProduct = `${root}/employee/dataTransaction`
    // Sử dụng AJAX để lấy dữ liệu từ server
    $.ajax({
        url: UrldataProduct, // Đường dẫn tới API endpoint của bạn
        type: 'GET',
        success: function (data) {
            // Khi nhận được dữ liệu từ server
            const select = $('#customer');

            // Loop qua dữ liệu và tạo các option cho select
            data.forEach(function (product) {
                productDataList.push(product);
            });
        },
        error: function (err) {
            console.error(err); // Xử lý lỗi nếu có
        }
    });

    notiSuccessAddTrans()
    $('#notification-save-invoice').hide()
});

let number = 1

// BAGIAN KIRI
// invoice dan customer

// Select2 bootstrap4 theme
// $('#customer').select2({
//     theme: 'bootstrap4',
//     "language": {
//         "noResults": function () {
//             return "<small class='text-danger'>Không tìm thấy tên khách hàng</small>"
//         }
//     },
//     escapeMarkup: function (markup) {
//         return markup
//     }
// })

// ketika select nama customer diubah
// $('#customer').change(function () {

//     let id = $(this).val()

//         $('#no_telp').attr('placeholder', 'Nhập sdt')
//         $('#alamat').val('')
//         $('#info_ln').val('')


// })
// Danh sách giả định


// Sự kiện input khi người dùng nhập vào ô input
$('#searchInput').on('input', function () {
    const inputValue = $(this).val().toLowerCase();
    const results = customerDataList.filter(item => item['Phone Number'].includes(inputValue));

    const optionsList = $('#optionsList');
    optionsList.empty();



    results.forEach(result => {
        optionsList.append(`<li data-value="${result['Phone Number']}">${result['Phone Number']}</li>`);
    });

    //new customer
    if (results.length === 0) {
        $('#no_Name').prop('disabled', false).css('cursor', 'auto').val('');
        $('#no_address').prop('disabled', false).css('cursor', 'auto').val('');
    } else {
        $('#no_Name').prop('disabled', true).css('cursor', 'not-allowed');
        $('#no_address').prop('disabled', true).css('cursor', 'not-allowed');
        handleClickCustomerPhone(results)

    }


})

$('#inputBayar').on('input', function () {
    const inputValue = parseFloat($(this).val());

    if (inputValue >= finalTotal) {
        if ($('#searchInput').val()) {
            $('#btnCetak').prop('disabled', false).css('cursor', 'pointer')

        }
        else {
            $('#btnSimpan').prop('disabled', true).css('cursor', 'not-allowed')
            $('#btnCetak').prop('disabled', true).css('cursor', 'not-allowed')

        }
        $('#outputChange').val(inputValue - finalTotal)
    } else {
        $('#outputChange').val('')
        $('#btnCetak').prop('disabled', true).css('cursor', 'not-allowed')
    }
})
$('#btnCetak').on('click',async function () {
    let customerName = $('#no_Name').val()
    let phone = $('#searchInput').val()
    let Address = $('#no_address').val()
    let total = $('#input-grandTotal').val()
    let receive = $('#inputBayar').val()
    let outChange = $('#outputChange').val()
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0'); // Lấy ngày và format thành chuỗi 2 ký tự, thêm '0' nếu cần
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Lấy tháng (index từ 0), cộng thêm 1 và format
    const year = currentDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    let Buy = []
    let k = 1
    const arr2 = [];

    BuyArr.forEach(obj => {
        arr2.push({ "quantity": parseInt(obj.Quantity),
                    "description": obj.Name,
                    "price": parseFloat(obj.Price),
                    "tax-rate": 0
                    }); 
    });

    let data = {
        'Customer Name': customerName,
        'Phone Number': phone,
        'Address': Address,
        'Total': total,
        'Receive': receive,
        'Repay': outChange
    };

    var dataI = {
        // If not using the free version, set your API key
        // "apiKey": "123abc", // Get apiKey through: https://app.budgetinvoice.com/register


        // Your own data

        // Your recipient
        "client": {
            "company": customerName,
            "address": Address
        },
        "information": {
            // Invoice data
            "date": formattedDate,
        },

        "products": arr2
        ,
        // The message you would like to display on the bottom of your invoice
        "bottom-notice": "Cảm ơn bạn vì đã mua hàng",
        // Settings to customize your invoice
        "settings": {
            "currency": "VND",
        },

    };

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const Params = dataI

    await fetch("/employee/transactionOder",
        {
            method: "POST",
            headers: myHeaders,
            mode: "cors",
            cache: "default",
            body: JSON.stringify(Params),
        }
    ).then((response) => response.json())
    .then(result => {
        if(result.success){
            $('#btnSimpan').prop('disabled', false).css('cursor', 'pointer')
            notiSuccessAddOderPdf()
        }
    })
  // easyinvoice.createInvoice(dataI, async function (result) {
    //     easyinvoice.render('pdf', result.pdf, function () {
    //         console.log('Invoice rendered!');
    //     });
    // });
    data.Buy = Buy
    
})
$('#btnSimpan').on('click', async function () {
    let customerName = $('#no_Name').val()
    let phone = $('#searchInput').val()
    let Address = $('#no_address').val()
    let total = $('#input-grandTotal').val()
    let receive = $('#inputBayar').val()
    let outChange = $('#outputChange').val()

    let Buy = {}
    let k = 1
    for (const item of BuyArr) {
        Buy[k] = item
        k += 1
    }

    let data = {
        'Customer Name': customerName,
        'Phone Number': phone,
        'Address': Address,
        'Total': total,
        'Receive': receive,
        'Repay': outChange
    };

    data.Buy = Buy
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const Params = data

    await fetch("/employee/transaction",
        {
            method: "POST",
            headers: myHeaders,
            mode: "cors",
            cache: "default",
            body: JSON.stringify(Params),
        }
    ).then((response) => response.json())
        .then((data) =>
            window.location.href = "/employee/transaction?status=success&message='Đã tạo thành công hóa đơn'"
        )



})

$('#qty_head').on('change', function () {
    $('#subtotal_head_appear').val($('#qty_head').val() * $('#productPrice_head_appear').val())
})

$('#btnAdd').on('click', function () {
    if (!$('#qty_head').val()) {
        return false;
    }
    let Barcode = $('#input_code').val();
    let productName = $('#nama_barang_hide').val()
    let price = $('#productPrice_head_appear').val();
    let quantity = $('#qty_head').val();
    let subtotal = $('#subtotal_head_appear').val();



    BuyArr.push({ "Barcode": Barcode, "Name": productName, "Price": price, "Quantity": quantity, "Subtotal": subtotal })

    finalTotal = finalTotal + parseFloat(subtotal)
    $('#grandTotal').text('Tổng cộng:' + finalTotal + 'vnd');
    $('#input-grandTotal').val(finalTotal)
    let btnDelete = `
    <td number="${number}" width="60px">
        <button class="btn btn-danger btnDelete"   onclick="deleteRow('${Barcode}')" cursor="pointer">
        <i class="las la-trash"></i>
        </button>
    </td>
    `
    // Tạo một hàng mới trong tbody
    let newRow = `<tr id="${Barcode}">` +
        '<td>' + number + '</td>' +
        '<td>' + Barcode + '</td>' +
        '<td>' + productName + '</td>' +
        '<td>' + price + '</td>' +
        '<td>' + quantity + '</td>' +
        '<td>' + subtotal + '</td>' +
        btnDelete
    '</tr>';

    // Đẩy hàng mới vào tbody
    $('#tbodyTransaksi').append(newRow);
    // Reset các ô input để nhập thông tin mới
    $('#productPrice_head_appear').val('');
    $('#qty_head').val('');
    $('#subtotal_head_appear').val('');
    $('#input_code').val('').focus(); // Đặt lại trỏ chuột vào ô input_code để tiếp tục nhập
    $('#qty_head').prop('disabled', true).css('cursor', 'not-allowed').val('');
    $('#inputBayar').val('')
    number += 1;
    return false; // Ngăn chặn việc reload trang khi nhấn nút
});




$('#input_code').on('input', function () {
    const inputValue = $(this).val().toLowerCase();
    const results = productDataList.filter(item => {
        return item.Product.toLowerCase().includes(inputValue.toLowerCase()) ||
            item.Barcode.toLowerCase().includes(inputValue.toLowerCase());
    });

    const optionsList = $('#optionsList-product');
    optionsList.empty();

    results.forEach(result => {
        optionsList.append(`<li data-value="${result.Barcode}">Tên sản phẩm: ${result.Product}/ Barcode: ${result.Barcode}</li>`);
    });

    if (results.length != 0) {

        handleInputProductClick(results)
    } else {
        $('#btnAdd').prop('disabled', true).css('cursor', 'not-allowed');
        $('#qty_head').prop('disabled', true).css('cursor', 'not-allowed').val('');
    }
})



// Xử lý khi người dùng chọn một kết quả
function handleClickCustomerPhone(cusList) {
    $('#optionsList').on('click', 'li', function () {

        const selectedValue = $(this).attr('data-value');

        cusList.forEach(customer => {
            if (customer['Phone Number'] == selectedValue) {
                $('#no_Name').val(customer.Name)
                $('#no_address').val(customer.Address)
                // if ($('#inputBayar').val()) {
                //     $('#btnSimpan').prop('disabled', false).css('cursor', 'pointer')
                // } else {
                //     $('#btnSimpan').prop('disabled', true).css('cursor', 'not-allowed')

                // }
                return
            }
        })
        $('#searchInput').val(selectedValue);
        $('#optionsList').empty();

    });
}

function handleInputProductClick(productList) {
    $('#optionsList-product').on('click', 'li', function () {
        const selectedValue = $(this).attr('data-value');
        $('#input_code').val(selectedValue);
        productList.forEach(product => {
            if (product.Barcode == selectedValue) {
                $('#productPrice_head_appear').val(product.RePrice)
                $('#nama_barang_hide').val(product.Product)
                $('#btnAdd').prop('disabled', false).css('cursor', 'auto');

                return
            } else {
                $('#qty_head').prop('disabled', false).css('cursor', 'auto').val('');
            }
        })
        $('#optionsList-product').empty();

    });
}

function deleteRow(idRow) {
    let row = $(`#${idRow}`);
    let value = parseFloat($(`#${idRow} td:eq(5)`).text());
    let numrow = $(`#${idRow} td:eq(6)`).attr('number')
    finalTotal = finalTotal - value;

    BuyArr = BuyArr.filter(item => item.Barcode !== idRow);

    $('#grandTotal').text('Tổng cộng: ' + finalTotal + 'vnd');

    $(`#${idRow}`).remove();
    updateIndexes();
    // Lấy tất cả thẻ td trong thẻ tr
    number -= 1;

    // Lấy giá trị của thẻ td con (vd: thẻ td thứ 2)
}

// Hàm cập nhật index của các hàng sau khi xóa
function updateIndexes() {
    $('#tblTransaksi #tbodyTransaksi tr').each(function (index) {
        $(this).find('td:first').text(index + 1); // Cập nhật số thứ tự
    });
}

function notiSuccessAddTrans() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const status = urlParams.get('status');

    if (message && status === 'success') {
        $('#notification-delete-product').show(); // Hiển thị phần tử
        setTimeout(() => {
            let root = window.location.origin;
            $('#notification-delete-product').hide()
            window.location.href = `${root}/employee/transaction`
        }, 2300);
    } else {
        $('#notification-delete-product').hide(); // Ẩn phần tử
    }
}

function notiSuccessAddOderPdf() {
        $('#notification-save-invoice').show(); // Hiển thị phần tử
        setTimeout(() => {
            $('#notification-save-invoice').hide()
        }, 2300);
 
}




// $('#input_kode').on('input', function() {
//     const inputValue = $(this).val().toLowerCase();
//     const results = dataList.filter(item => item.toLowerCase().includes(inputValue));

//     const resultsDiv = $('#input_kode');
//     resultsDiv.empty();

//     results.forEach(result => {
//         resultsDiv.append(`<div style="display: block;">${result}</div>`);
//     });

//     // Xử lý khi người dùng chọn một kết quả
//     $('#input_kode div').click(function() {
//         const selectedValue = $(this).text();
//         $('#input_kode').val(selectedValue);
//         resultsDiv.empty();
//     });
// });
// AKHIR BAGIAN KIRI 

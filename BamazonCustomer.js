var inquirer = require('inquirer');
var mysql = require('mysql');
var Table = require('cli-table');
var connection = mysql.createConnection({
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "Targetmith!2354",
    database: "server_db"
});
connection.connect(function(err) {
    if (err) throw err;

});

var bamazon = function() {
    process.stdout.write('\033c');
    val = [];
    connection.query("SELECT * FROM  bamazon.products ", function(err, res) {
        if (err) {
            console.log(err);
        } else {

            var table = new Table({
                head: ['ID', 'Product Name', 'Department', 'Price ($)', 'Quantity'],
                colWidths: [8, 15, 15, 15, 15, ],
            });

            for (var i = 0; i < res.length; i++) {
                table.push([res[i].ItemId, res[i].ProductName, res[i].DepartmentName, res[i].Price, res[i].StockQuantity]);
                val.push(res[i].ItemId);
            }
            console.log(table.toString());

        }

        var checkout = [{
            type: 'input',
            name: 'ID',
            message: 'Please enter the ID of the product you would like to purchase:\n',
            validate: function(value) {
                var valid = val.includes(value);
                return valid || 'Please enter a valid ID (Case Sensitive)';
            },
            filter: String
        }, {
            type: 'input',
            name: 'quantity',
            message: 'Please enter the quantity:\n',
            validate: function(value) {
                var valid = !isNaN(parseInt(value));
                return valid || 'Please enter a number';
            },
            filter: Number
        }];

        var anotherPurchase = [{
            type: 'confirm',
            name: 'yes',
            message: 'Is there anything else you would like to purchase at this time?',
            default: true

        }];
        inquirer.prompt(checkout)

        .then(function(order) {
            connection.query("SELECT Price, StockQuantity FROM bamazon.products WHERE ?", [{
                ItemID: order.ID,
            }], function(err, res2) {
                if (res2[0].StockQuantity <= 0) {
                    console.log("Insufficient Quantity");
                    buy();
                } else {
                    connection.query("UPDATE bamazon.products SET StockQuantity = GREATEST(StockQuantity - ?,0) WHERE ItemID = ?", [
                        order.quantity,
                        order.ID,

                    ], function() {

                        connection.query("SELECT Price, StockQuantity FROM bamazon.products WHERE ?", [{
                            ItemID: order.ID,
                        }], function(err, res3) {

                            if (res3[0].StockQuantity <= 0) {
                                console.log("You may only purchase " + res2[0].StockQuantity + " units");
                                console.log("  \nYour total is $" + (res3[0].Price * order.quantity).toFixed(2) + "\n");
                                buy();
                            } else {
                                connection.query("SELECT Price,StockQuantity FROM bamazon.products WHERE ?", [{
                                    ItemID: order.ID,
                                }], function(err, res4) {
                                    console.log("  \nYour total is $" + (res4[0].Price * order.quantity).toFixed(2) + "\n");
                                    buy();
                                });
                            }
                        });
                    });
                }

            });

        });

        var buy = function() {
            inquirer.prompt(anotherPurchase)

            .then(function(response) {

                if (response.yes === true) {
                    bamazon();
                } else {
                    console.log("\n  Thank you for shopping at Bamazon!");
                    connection.end();
                }
            });
        };
    });
};
bamazon();

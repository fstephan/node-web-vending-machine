import { BeforeAll, AfterAll, Before, After, Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { VendingMachine, Product } from '../../../src/vending-machine.js'

let vendingMachine;
let actualProduct=null;
let actualChange=null;

BeforeAll(async () => {
    let coke = new Product('Coke', 200);
    let mars = new Product('Mars', 100);
    vendingMachine = new VendingMachine({numSlots:2});
    vendingMachine.addCoinsForChange(25, 4);
    vendingMachine.configureSlot(1, 'Coke', 200);
    vendingMachine.configureSlot(2, 'Mars', 100);
    vendingMachine.addProductsToSlot(1, coke, 5);
    vendingMachine.addProductsToSlot(2, mars, 1);
})

AfterAll(async () => {
})

Before(async () => {
    vendingMachine.addCoinsForChange(25, 4);
    actualChange=null;
    actualProduct=null;
})

Given('I insert {int} quarters', async function (quarters) {
        vendingMachine.insertCoins(25, quarters);
});

Given('I insert {int} dimes', async function (dimes) {
    vendingMachine.insertCoins(10, dimes);
});

Given('I insert {int} nickels', async function (nickels) {
    vendingMachine.insertCoins(5, nickels);
});

Given('I insert {int} bills', async function (bills) {
    vendingMachine.insertBills(1*100, bills);
});

When('I buy {int} product', async function (selection) {
    actualProduct = vendingMachine.buyProduct(selection);
});

When('I release change', async function () {   
    actualChange = vendingMachine.releaseChange();
});

Then('I should receive {string} product', async function (expected) {
    if (actualProduct) {
        actualProduct = actualProduct.name;
    }
    else {
        actualProduct ='';
    }
    assert.equal(actualProduct, expected);
});

Then('I should see {string} message', async function (expected) {
    const message = vendingMachine.message;
    assert.equal(message, expected);
});

Then('I should get {string} in change', async function (expected) {
    if (actualChange) {
        actualChange = `${actualChange.quarters}Q, ${actualChange.dimes}D, ${actualChange.nickels}N`
    }
    else {
        actualChange = '0Q, 0D, 0N';
    }
    assert.equal(actualChange, expected);
});


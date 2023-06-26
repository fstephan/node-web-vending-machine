import { Builder, Browser, By, Key, until } from 'selenium-webdriver';
import { BeforeAll, AfterAll, Before, After, Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { WebServer } from '../../../src/web-server.js'
import { VendingMachine, Product, VendingMachineDBManager } from '../../../src/vending-machine.js'

let webServer;
let vendingMachineDBManager;
let driver;
let defaultID;

BeforeAll(async () => {
    let coke = new Product('Coke', 200);
    let mars = new Product('Mars', 100);
    const vendingMachine = new VendingMachine({numSlots:2});
    vendingMachine.addCoinsForChange(25, 100);
    vendingMachine.configureSlot(1, 'Coke', 200);
    vendingMachine.configureSlot(2, 'Mars', 100);
    vendingMachine.addProductsToSlot(1, coke, 5);
    vendingMachine.addProductsToSlot(2, mars, 1);
    vendingMachineDBManager = new VendingMachineDBManager('mongodb://127.0.0.1:27017/', 'vending-machine-db-test');
    await vendingMachineDBManager.create(vendingMachine);
    defaultID = vendingMachine.id;
    webServer = new WebServer({ port: 3001, publicDirectoryPath: 'C:/Users/fadis/Documents/code/js-code/Examples/vending-machine/public', vendingMachineDBManager });
    driver = await new Builder().forBrowser(Browser.FIREFOX).build();
    console.log('starting browser');
    await driver.get('http://localhost:3001/machines/'+defaultID);
    await driver.sleep(100);
})

AfterAll(async () => {
    console.log('closing db');
    await vendingMachineDBManager.close();
    console.log('closing browser');
    await driver.quit();
    console.log('closing server');
    webServer.close();
    console.log('server closed');
})

Before(async () => {
    //vendingMachine.addCoinsForChange(25, 4);
    const vendingMachine = await vendingMachineDBManager.retrieve(defaultID);
    vendingMachine.cashOut();
    vendingMachine.addCoinsForChange(25, 100);    
    await vendingMachineDBManager.save(vendingMachine);
    await clear('coin');
    await clear('bill');
    await clear('credit-card');
    await clear('selection');
})

Given('I insert {int} quarters', async function (quarters) {
    if (quarters>0) {
        await enter('coin', '25');
    }
    for (let index = 0; index < quarters; index++) {
        await click('insert-coin');  
    }
    await clear('coin');
});

Given('I insert {int} dimes', async function (dimes) {
    if (dimes>0) {
        await enter('coin', '10');
    }
    for (let index = 0; index < dimes; index++) {
        await click('insert-coin');  
    }
    await clear('coin');
});

Given('I insert {int} nickels', async function (nickels) {
    if (nickels>0) {
        await enter('coin', '5');
    }
    for (let index = 0; index < nickels; index++) {
        await click('insert-coin');  
    }
    await clear('coin');
});

Given('I insert {int} bills', async function (bills) {
    if (bills>0) {
        await enter('bill', '1');
    }
    for (let index = 0; index < bills; index++) {
        await click('insert-bill');  
    }
    await clear('bill');
});

When('I buy {int} product', async function (selection) {
    await enter('selection', selection);
    await click('purchase');
});

When('I release change', async function () {   
    await click('release-change');
});

Then('I should receive {string} product', async function (expected) {
    const product = await getText('product');
    assert.equal(product, expected);
});


Then('I should see {string} message', async function (expected) {
    const message = await getText('message');
    assert.equal(message, expected);
});


Then('I should get {string} in change', async function (expected) {
    const change = await getText('change-amount');
    assert.equal(change, expected);
});



async function click(elId) {
    await driver.findElement(By.id(elId)).click();
    await driver.sleep(100);
}

async function enter(elId, value) {
    await driver.findElement(By.id(elId)).sendKeys(value);
    await driver.sleep(100);
}

async function getText(elId) {
    let el = await driver.findElement(By.id(elId));
    await driver.wait(until.elementIsVisible(el), 1000);
    const text = await el.getText();
    return text;
}
async function clear(elId) {
    await driver.findElement(By.id(elId)).clear();
    await driver.sleep(100);
}


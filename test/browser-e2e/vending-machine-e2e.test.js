import { Builder, Browser, By, Key, until } from 'selenium-webdriver';
import { VendingMachine, Product, VendingMachineDBManager } from '../../src/vending-machine.js'
import { WebServer } from '../../src/web-server.js'
describe("VendingMachine", () => {
    let webServer;
    let vendingMachineDBManager;
    let originalTimeout;
    let driver;
    let defaultID;
    beforeAll(async () => {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;        
        let coke = new Product('Coke', 200);
        let mars = new Product('Mars', 100);
        const vendingMachine = new VendingMachine({numSlots:2});
        vendingMachine.addCoinsForChange(25, 4);
        vendingMachine.configureSlot(1, 'Coke', 200);
        vendingMachine.configureSlot(2, 'Mars', 100);
        vendingMachine.addProductsToSlot(1, coke, 5);
        vendingMachine.addProductsToSlot(2, mars, 1);
        vendingMachineDBManager = new VendingMachineDBManager(process.env.DB_CONNECTION, process.env.DATABASE_NAME);
        await vendingMachineDBManager.create(vendingMachine);
        defaultID = vendingMachine.id;
        webServer = new WebServer({ port: process.env.PORT, vendingMachineDBManager });
        driver = await new Builder().forBrowser(Browser.FIREFOX).build();
        console.log('starting browser');
        await driver.get(`http://localhost:${process.env.PORT}/machines/${defaultID}`);
        await driver.sleep(100);
    })
    afterAll(async () => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        await driver.quit();
        console.log('closing browser');
        webServer.close();
    })
    beforeEach(async () => {
        const vendingMachine = await vendingMachineDBManager.retrieve(defaultID);
        vendingMachine.cashOut();
        vendingMachine.addCoinsForChange(25, 4);    
        await vendingMachineDBManager.save(vendingMachine);
        await clear('coin');
        await clear('bill');
        await clear('credit-card');
        await clear('selection');
    })
    it('should display price of product when clicked', async () => {
        try {
            await enter('selection', '1');
            await click('purchase');
            const message = await getText('message');
            expect(message).toBe('Please add 200c');
        }
        catch (error) {
            console.log('error', error);
            fail(error);
        }
    })
    it('should display payment when 10c is inserted', async () => {
        try {
            await enter('coin', '10');
            await click('insert-coin');
            const message = await getText('message');
            expect(message).toBe('Payment: 10');            
        }
        catch (error) {
            console.log('error', error);
            fail(error);
        }
    })
    it('should display payment when 100c is inserted', async () => {
        try {
            await enter('bill', '1');
            await click('insert-bill');
            const message = await getText('message');           
            expect(message).toBe('Payment: 100');
        }
        catch (error) {
            console.log('error', error);
            fail(error);
        }
    })
    it('should display authrozied when swiping credit card', async () => {
        try {
            await enter('credit-card', '123');
            await click('swipe');
            const message = await getText('message'); 
            expect(message).toBe('Credit Card Authorized');
            //clean-up - reset to unauthorized
            await enter('credit-card', '0');
            await click('swipe');            
        }
        catch (error) {
            console.log('error', error);
            fail(error);
        }
    })
    it('should dispense product when paying by credit card', async () => {
        try {
            await enter('credit-card', '123');
            await click('swipe');
            await enter('selection', '1');
            await click('purchase');
            const message = await getText('message'); 
            const product = await getText('product'); 
            expect(product).toBe('Coke');
            expect(message).toBe('Enjoy!');
        }
        catch (error) {
            console.log('error', error);
            fail(error);
        }
    })
    it('should dispense product when paying by coin', async () => {
        try {
            await enter('coin', '25');
            await click('insert-coin');
            await click('insert-coin');
            await click('insert-coin');
            await click('insert-coin');
            await enter('selection', '2');
            await click('purchase');
            const product = await getText('product'); 
            expect(product).toBe('Mars');
        }
        catch (error) {
            console.log('error', error);
            fail(error);
        }
    })
    it('should dispense product when paying by bills', async () => {
        try {
            await enter('bill', '1');
            await click('insert-bill');
            await click('insert-bill');           
            await enter('selection', '1');
            await click('purchase');
            const product = await getText('product'); 
            expect(product).toBe('Coke');
        }
        catch (error) {
            console.log('error', error);
            fail(error);
        }
    })
    it('should release change when paying by bills', async () => {
        try {
            await enter('bill', '1');
            await click('insert-bill');
            await click('release-change');   
            const change = await getText('change-amount'); 
            expect(change).toBe('4Q, 0D, 0N');
        }
        catch (error) {
            console.log('error', error);
            fail(error);
        }
    })
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
})


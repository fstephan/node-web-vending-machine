import Request from 'supertest'
import { VendingMachine, VendingMachineDBManager } from '../../src/vending-machine.js'
import { WebServer } from '../../src/web-server.js'

describe("VendingMachine", () => {
    let webServer;
    let vendingMachine;
    let vendingMachineDBManager;
    let defaultID;
    beforeAll(async () => {
        vendingMachineDBManager = new VendingMachineDBManager(process.env.DB_CONNECTION, process.env.DATABASE_NAME);
        webServer = new WebServer({ port: 3001, vendingMachineDBManager });
    })
    beforeEach(async()=> {
        await vendingMachineDBManager.deleteAll();
        const vendingMachine = new VendingMachine({ name: 'test', numSlots: 3 });
        vendingMachine.addBillsForChange(500, 5);
        vendingMachine.addBillsForChange(100, 4);
        vendingMachine.addCoinsForChange(25, 3);
        vendingMachine.addCoinsForChange(10, 2);
        vendingMachine.addCoinsForChange(5, 1);
        await vendingMachineDBManager.create(vendingMachine);
        defaultID = vendingMachine.id;
    })
    afterAll(async () => {
        await vendingMachineDBManager.drop();
        await vendingMachineDBManager.close();
        await webServer.close();
    })   
    it('should create a new vendingm machine', async () => {
        const response = await Request(webServer.app).post('/machines/').send({
            name: 'Vending Machine 1',
            numSlots: 2
        });
        const body = response.body;
        const vendingMachine = await vendingMachineDBManager.retrieve(body.id);
        expect(vendingMachine.name).toBe('Vending Machine 1');
        expect(body.name).toBe('Vending Machine 1');
        expect(body.slots.length).toBe(2);
    })
    it('should retrieve existing vendingm machine', async () => {
        const response = await Request(webServer.app).get('/machines/' + defaultID.valueOf()).send();
        expect(response.text).toContain('test');
    })
    it('should update slot', async () => {
        const response = await Request(webServer.app).patch(`/machines/${defaultID.valueOf()}/slots`).send({
            slotNo: 1,
            name: 'Coke',
            price: 200
        });
        const body = response.body;
        const vendingMachine = await vendingMachineDBManager.retrieve(body.id);
        expect(vendingMachine.slots[0].name).toBe('Coke');
        expect(body.slots[0].name).toBe('Coke');
    })
    it('should add products', async () => {
        const response = await Request(webServer.app).patch(`/machines/${defaultID.valueOf()}/products`).send({
            slotNo: 1,
            name: 'Coke',
            quantity: 3
        });
        const body = response.body;
        const vendingMachine = await vendingMachineDBManager.retrieve(body.id);
        expect(vendingMachine.slots[0].products.length).toBe(3);
        expect(body.slots[0].products.length).toBe(3);
        expect(body.slots[0].products[0].name).toBe('Coke');
        expect(body.slots[0].products[0].price).toBe(body.slots[0].price);
    })
    it('should cashout', async () => {
        const response = await Request(webServer.app).patch(`/machines/${defaultID.valueOf()}/cash`).send();
        const body = response.body;
        const vendingMachine = await vendingMachineDBManager.retrieve(body.id);
        expect(vendingMachine.change).toEqual({ fives: 0, ones: 0, quarters: 0, dimes: 0, nickels: 0 });
        expect(body.cash).toEqual({ fives: 5, ones: 4, quarters: 3, dimes: 2, nickels: 1 });
    })
    it('should add money for change', async () => {
        const response = await Request(webServer.app).patch(`/machines/${defaultID.valueOf()}/coins`).send({
            quarters: 100,
            dimes: 50,
            nickels: 10
        });
        if (response.error) {
            console.log(response.error);
            fail('failed to make a call');
            return;
        }
        const body = response.body;
        vendingMachine = await vendingMachineDBManager.retrieve(body.id);
        expect(vendingMachine.change).toEqual({ fives: 5, ones: 4, quarters: 103, dimes: 52, nickels: 11 });
    })
})


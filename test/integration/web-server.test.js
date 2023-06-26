import Request from 'supertest'
import { VendingMachine, Product } from '../../src/vending-machine.js'
import { WebServer } from '../../src/web-server.js'

describe("VendingMachine", () => {
    let webServer;
    let vendingMachine;
    let defaultID;
    beforeAll(async () => {
        const change = {
            fives:0,
            ones:0,
            quarters: 4,
            dimes: 0,
            nickels: 0
        };
        let coke = new Product('Coke', 200);
        let mars = new Product('Mars', 100);
        vendingMachine = new VendingMachine({numSlots:2});
        vendingMachine.addCoinsForChange(25, 4);
        vendingMachine.configureSlot(1, 'Coke', 200);
        vendingMachine.configureSlot(2, 'Mars', 100);
        vendingMachine.addProductsToSlot(1, coke, 5);
        vendingMachine.addProductsToSlot(2, mars, 1);
        defaultID=123;
        const vendingMachineDBManager=jasmine.createSpyObj('mockDBManager',['save','retrieve']);
        vendingMachineDBManager.retrieve.and.returnValue(vendingMachine);
        webServer = new WebServer({port:process.env.PORT, vendingMachineDBManager});
    })
    afterAll(async () => {
        if (webServer) webServer.close();
    })
    beforeEach(async () => {
        vendingMachine.addCoinsForChange(25, 250);
        vendingMachine.addCoinsForChange(10, 100);
    })
    it('should return message when purchase', async () => {
        const response = await Request(webServer.app).patch(`/machines/${defaultID}/selection`).send({selection: 1});
        //const response = await Request(webServer.app).patch(`/machines/${defaultID}/selection`).send({selection: 1});
        const body = response.body;
        expect(body.product).toBe('');
        expect(body.message).toBe('Please add 200c');
        expect(body.change).toEqual({quarters : 0, dimes : 0, nickels : 0});
    })
})


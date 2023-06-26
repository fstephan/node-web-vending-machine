import { VendingMachine, Product, VendingMachineDBManager } from '../../src/vending-machine.js'

describe('VendingMache', () => {
    let vendingMachine;
    let vendingManager;
    beforeAll(async () => {
        let coke = new Product('Coke', 200);
        let mars = new Product('Mars', 100);
        vendingMachine = new VendingMachine({numSlots:2});
        vendingMachine.addCoinsForChange(25, 4);
        vendingMachine.configureSlot(1, 'Coke', 200);
        vendingMachine.configureSlot(2, 'Mars', 100);
        vendingMachine.addProductsToSlot(1, coke, 5);
        vendingMachine.addProductsToSlot(2, mars, 1);
        vendingManager = new VendingMachineDBManager(process.env.DB_CONNECTION,process.env.DATABASE_NAME);
        await vendingManager.deleteAll();
        await vendingManager.create(vendingMachine);
    })
    afterAll(async () => {
        console.log("closing");
        await vendingManager.drop();
        await vendingManager.close();
        console.log("closed");
    });

    it('it should remove a product after purchase', async () => {
        expect(vendingMachine.slots[1].products.length).toBe(1);
        vendingMachine.insertBills(100);
        const product = vendingMachine.buyProduct(2);
        expect(product).not.toBeNull();
        await vendingManager.save(vendingMachine);
        const updatedVendingMachine = await vendingManager.retrieve(vendingMachine.id);
        expect(updatedVendingMachine.id).toEqual(vendingMachine.id);
        expect(updatedVendingMachine.slots[1].products.length).toBe(0);
        expect(updatedVendingMachine.slots[1].products.length).toBe(vendingMachine.slots[1].products.length);
    })

})
  
/*
async function addDefaulData() {
    try {
        console.log("About to connect");
        const database = client.db('vending-machine-db');
        const vend = database.collection('vending-machine');
        console.log("connected");
        console.log("adding");
        const vendingData = {
            name: 'Vend1',
            payment: 0,
            change: { fives: 0, ones: 0, quarters: 0, dimes: 0, nickels: 0 },
            slots: [
                {
                    name: 'Coke',
                    price: 200,
                    products: [
                        { name: 'Coke', price: 200 },
                        { name: 'Coke', price: 200 },
                        { name: 'Coke', price: 200 },
                        { name: 'Coke', price: 200 },
                        { name: 'Coke', price: 200 }

                    ]
                },
                {
                    name: 'Mars',
                    price: 100,
                    products: [
                        { name: 'Mars', price: 100 },
                        { name: 'Mars', price: 100 }
                    ]
                }
            ]
        };
        const result = await vend.insertOne(vendingData);
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
    }
    catch (err) {
        console.log(err);
    }
    finally {
        console.log("closing");
        await client.close();
        console.log("closed");
    }
}
*/
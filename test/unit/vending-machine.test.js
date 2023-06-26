import { VendingMachine, COIN, BILL, Product } from '../../src/vending-machine.js'
describe('VendingMachine', () => {
    let vendingMachine;
    beforeEach(() => {
        let coke = new Product('Coke', 200);
        let mars = new Product('Mars', 100);
        let data = {
            id: 0, payment: 0, slots: [
                { name: 'Coke', price: 200, products: [coke, coke, coke, coke, coke] },
                { name: 'Mars', price: 100, products: [mars] },
            ], change: {
                fives: 0,
                ones: 0,
                quarters: 4,
                dimes: 0,
                nickels: 0
            }
        }
        //vendingMachine = new VendingMachine(data);
        vendingMachine = new VendingMachine({id:0, numSlots:2});
        vendingMachine.addCoinsForChange(25, 4);
        vendingMachine.configureSlot(1, 'Coke', 200);
        vendingMachine.configureSlot(2, 'Mars', 100);
        vendingMachine.addProductsToSlot(1, coke, 5);
        vendingMachine.addProductsToSlot(2, mars, 1);
    })
    describe('changeOut', () => {
        it('should return all money in machine', () => {
            vendingMachine.insertBills(100);
            const cash = vendingMachine.cashOut();
            expect(cash.quarters).toBe(4);
            expect(cash.ones).toBe(1);
            expect(vendingMachine.payment).toBe(0);
        });
        it('should reset change to 0', () => {
            vendingMachine.insertBills(100);
            vendingMachine.cashOut();
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(0);
        });
    })
    describe('releaseChange', () => {
        it('should return no change when no money', () => {
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(0);
            expect(change.dimes).toBe(0);
            expect(change.nickels).toBe(0);
        })
        it('should return 1 quarter in change when 1 quarter is added', () => {
            vendingMachine.insertCoins(COIN.QUARTER);
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(1);
            expect(change.dimes).toBe(0);
            expect(change.nickels).toBe(0);
        })
        it('should return 1 dime in change when 1 dime is added', () => {
            vendingMachine.insertCoins(COIN.DIME);
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(0);
            expect(change.dimes).toBe(1);
            expect(change.nickels).toBe(0);
        })
        it('should return 1 nickel in change when 1 nickel is added', () => {
            vendingMachine.insertCoins(COIN.NICKEL);
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(0);
            expect(change.dimes).toBe(0);
            expect(change.nickels).toBe(1);
        })
        it('should return error when unknown coin is added', () => {
            expect(() => {
                vendingMachine.insertCoins(15);
            }).toThrowError('Unknown coin: 15');
        })
        it('should return 1 quarters, 1 dimes, and 1 nickels in change', () => {
            vendingMachine.insertCoins(COIN.QUARTER, 1);
            vendingMachine.insertCoins(COIN.DIME, 1);
            vendingMachine.insertCoins(COIN.NICKEL, 1);
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(1);
            expect(change.dimes).toBe(1);
            expect(change.nickels).toBe(1);
        })
        it('should return 1 quarters in change when 5 nickels added', () => {
            vendingMachine.insertCoins(COIN.NICKEL, 5);
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(1);
            expect(change.dimes).toBe(0);
            expect(change.nickels).toBe(0);
        })
        it('should return 0 nickel in change once changed is already released', () => {
            vendingMachine.insertCoins(COIN.NICKEL);
            vendingMachine.releaseChange();
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(0);
            expect(change.dimes).toBe(0);
            expect(change.nickels).toBe(0);
        })
        it('should return no change after product purchased', () => {
            vendingMachine.insertCoins(COIN.DIME, 10);
            vendingMachine.buyProduct(2);
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(0);
            expect(change.dimes).toBe(0);
            expect(change.nickels).toBe(0);
        })
        it('should return 4 quarters when 1 dollars is added', () => {
            vendingMachine.insertBills(BILL.ONE);
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(4);
            expect(change.dimes).toBe(0);
            expect(change.nickels).toBe(0);
        })
        it('should return no change when product purchase with credit card', () => {
            vendingMachine.swipeCreditCard(1234);
            vendingMachine.buyProduct(1);
            const change = vendingMachine.releaseChange();
            expect(change.quarters).toBe(0);
            expect(change.dimes).toBe(0);
            expect(change.nickels).toBe(0);
        })
    })
    describe('buyProduct', () => {
        it('should return no product when no money is added', () => {
            const product = vendingMachine.buyProduct(1);
            expect(product).toBeNull();
        })
        it('should return no product when not enough money is added', () => {
            vendingMachine.insertCoins(COIN.QUARTER);
            const product = vendingMachine.buyProduct(1);
            expect(product).toBeNull();
        })
        it('should return product when enough money is added', () => {
            vendingMachine.insertCoins(COIN.QUARTER, 4);
            const product = vendingMachine.buyProduct(2);
            expect(product).not.toBeNull();
        })
        it('should return product the right product when enough money is added', () => {
            vendingMachine.insertCoins(COIN.QUARTER, 8);
            const product = vendingMachine.buyProduct(1);
            expect(product.name).toBe('Coke');
        })
        it('should return no product when product already purchased', () => {
            vendingMachine.insertCoins(COIN.QUARTER, 8);
            vendingMachine.buyProduct(1);
            const product = vendingMachine.buyProduct(1);
            expect(product).toBeNull();
        })
        it('should return no product when product is out of stock', () => {
            vendingMachine.insertCoins(COIN.QUARTER, 20);
            vendingMachine.buyProduct(2);
            const product = vendingMachine.buyProduct(2);
            expect(product).toBeNull();
        })
        it('should return product when valid credit card is inserted', () => {
            vendingMachine.swipeCreditCard(1234);
            const product = vendingMachine.buyProduct(2);
            expect(product).not.toBeNull();
        })
        it('should not return product when valid credit card isinvalid', () => {
            vendingMachine.swipeCreditCard(0);
            const product = vendingMachine.buyProduct(2);
            expect(product).toBeNull();
        })
        it('should not return product when product already purchase with credit card', () => {
            vendingMachine.swipeCreditCard(1234);
            vendingMachine.buyProduct(1);
            const product = vendingMachine.buyProduct(1);
            expect(product).toBeNull();
        })
    })
    describe('getProductPrice', () => {
        it('should return the price of the product selected 2', () => {
            const price = vendingMachine.getProductPrice(2);
            expect(price).toBe(100);
        })
        it('should return the price of the product selected 1', () => {
            const price = vendingMachine.getProductPrice(1);
            expect(price).toBe(200);
        })
        it('should throw error if selection is invalid', () => {
            expect(() => {
                vendingMachine.getProductPrice(3)
            }).toThrowError('Invalid selection: 3');
        })
    })
    describe('message', () => {
        it('should display please take your change when changed is released', () => {
            vendingMachine.insertCoins(COIN.QUARTER, 3);
            vendingMachine.releaseChange();
            expect(vendingMachine.message).toBe('Please take your change');
        })
        it('should display no change when no change is released', () => {
            vendingMachine.releaseChange();
            expect(vendingMachine.message).toBe('No change to release');
        })
        it('should display enjoy when product is purchased', () => {
            vendingMachine.insertCoins(COIN.QUARTER, 8);
            vendingMachine.buyProduct(1);
            expect(vendingMachine.message).toBe('Enjoy!');
        })
        it('should display please add x amount when product purchased without enough money', () => {
            vendingMachine.insertCoins(COIN.QUARTER, 7);
            vendingMachine.buyProduct(1);
            expect(vendingMachine.message).toBe('Please add 25c');
        })
        it('should display sorry out of stock when product is out of stock', () => {
            vendingMachine.insertCoins(COIN.QUARTER, 20);
            vendingMachine.buyProduct(2);
            vendingMachine.buyProduct(2);
            expect(vendingMachine.message).toBe('Sorry! Out of stock');
        })
        it('should display price of product when selection is made', () => {
            vendingMachine.getProductPrice(2);
            expect(vendingMachine.message).toBe('Mars is 100c');
        })
        it('should display sorry out of change when change no longer available', () => {
            vendingMachine.insertBills(BILL.ONE);
            vendingMachine.insertBills(BILL.ONE);
            vendingMachine.releaseChange();
            expect(vendingMachine.message).toBe('Sorry! Out of change');
        })
    })
    describe('getPaymentAmount', () => {
        it('should return 100 when 1 dollar is added', () => {
            vendingMachine.insertBills(BILL.ONE);
            expect(vendingMachine.payment).toBe(100);
        })
        it('should return 5 when 5 dollars is added', () => {
            vendingMachine.insertBills(BILL.FIVE);
            expect(vendingMachine.payment).toBe(500);
        })
    })
})
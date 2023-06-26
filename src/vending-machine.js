import { MongoClient, ObjectId } from 'mongodb'

export class VendingMachineDBManager {
    #client;
    #database;
    #VendingMachineData;
    constructor(uri, database) {
        try {
            this.#client = new MongoClient(uri);
            this.#database = this.#client.db(database);
            this.#VendingMachineData = this.#database.collection('vending-machine');
        }
        catch (error) {
            throw new Error('Unable to connect to db', error);
        }
        
    }
    async drop() {
        await this.#VendingMachineData.drop();
    }
    async deleteAll() {
        await this.#VendingMachineData.deleteMany();
    }
    async delete(id) {
        await this.#VendingMachineData.deleteOne( { _id: new ObjectId(id) } );
    }
    async save(vendingMachine) {
        const result = await this.#VendingMachineData.replaceOne({ _id: new ObjectId(vendingMachine.id) },
            {
                name: vendingMachine.name,
                payment: vendingMachine.payment,
                change: vendingMachine.change,
                slots: vendingMachine.slots,
                creditCardAuthroziationNo: vendingMachine.creditCardAuthroziationNo
            });
    }
    async create(vendingMachine) {
        const result = await this.#VendingMachineData.insertOne(
            {
                name: vendingMachine.name,
                payment: vendingMachine.payment,
                change: vendingMachine.change,
                slots: vendingMachine.slots,
                creditCardAuthroziationNo: vendingMachine.creditCardAuthroziationNo
            });
        vendingMachine.id = result.insertedId;
    }
    async retrieve(id) {
        const document = await this.#VendingMachineData.findOne({ _id: new ObjectId(id) });
        if (document) {
            const vendingMachine = new VendingMachine(document);
            return vendingMachine;
        }
        else {
            throw new Error('No document found for id: ' + id);
        }
    }
    async findAll() {
        const docs= await this.#VendingMachineData.find({},{name:1}).toArray() ;
        return docs;
    }
    async close() {
        await this.#client.close();
    }
}

export class Product {
    name;
    price;
    constructor(name, price) {
        this.name = name;
        this.price = price;
    }
    get name() {
        return this.name;
    }
    get price() {
        return this.price;
    }
}

class Slot {
    products = [];
    name;
    price;
    constructor(name, price) {
        this.name = name;
        this.price = price;
    }
    addProducts(product, times = 1) {
        for (let index = 0; index < times; index++) {
            this.products.push(product);
        }
    }
    removeProduct(product) {
        return this.products.pop();
    }
    isProductAvailable() {
        return this.products.length > 0;
    }
    get price() {
        return this.price;
    }
    get name() {
        return this.name;
    }
    get products() {
        this.products
    }
}

export class VendingMachine {
    #id = 0;
    #name;
    #payment = 0;
    #change = {};
    slots = [];
    #message;
    #creditCardAuthroziationNo = 0;
    constructor({ _id, name, payment = 0, numSlots = 0, slots = [], change,creditCardAuthroziationNo } = {}) {
        const zeroChange = {
            fives: 0,
            ones: 0,
            quarters: 0,
            dimes: 0,
            nickels: 0
        };
        this.#id = _id;
        this.#name = name;
        this.#payment = payment;
        this.#creditCardAuthroziationNo=creditCardAuthroziationNo;
        if (numSlots > 0) {
            this.resetSlots(numSlots);
        }
        else if (slots.length > 0) {
            this.slots = [];
            slots.forEach((slot, index) => {
                this.slots[index] = new Slot(slot.name, slot.price);
                slot.products.forEach((product) => {
                    this.slots[index].addProducts(new Product(product.name, product.price));
                })
            })
        }
        else {
            throw new Error('Slots for vending machine must be configured');
        }
        this.#change = change || zeroChange;
    }
    addProductsToSlot(slot, product, times = 1) {
        this.slots[slot - 1].addProducts(product, times);
    }
    configureSlot(slot, name, price) {
        if (this.slots[slot - 1]) {
            this.slots[slot - 1].name = name;
            this.slots[slot - 1].price = price;
        }
        else {
            this.slots[slot - 1] = new Slot(name, price);
        }
    }
    resetSlots(numSlots) {
        while (this.slots.length>numSlots) {
            this.slots.pop();
        }
        while (this.slots.length<numSlots) {
            this.slots.push(new Slot('default', 0));
        }
    }
    addCoinsForChange(coin, times) {
        if (times === 0) {
            return;
        }
        else if (!times) {
            throw new Error('2nd argument required for addCoinsForChange');
        }
        else {
            this.insertCoins(coin, times);
            this.#payment = 0;
        }

    }
    addBillsForChange(bill, times) {
        if (times === 0) {
            return;
        }
        else if (!times) {
            throw new Error('2nd argument required for addBillsForChange');
        }
        else {
            this.insertBills(bill, times);
            this.#payment = 0;
        }
    }
    cashOut() {
        let changeToRelease = {};
        Object.assign(changeToRelease, this.#change)
        this.#change = {
            fives: 0,
            ones: 0,
            quarters: 0,
            dimes: 0,
            nickels: 0
        };
        this.#payment = 0;
        return changeToRelease;
    }
    getProductPrice(selection) {
        const slotNum = selection - 1;
        if (slotNum > this.slots.length - 1 || slotNum < 0) {
            throw new Error('Invalid selection: ' + selection);
        }
        this.#message = `${this.slots[slotNum].name} is ${this.slots[slotNum].price}c`;
        return this.slots[slotNum].price;
    }
    #isProductAvailable(selection) {
        const slotNum = selection - 1;
        return this.slots[slotNum].isProductAvailable();
    }
    buyProduct(selection) {
        const price = this.getProductPrice(selection);

        if (this.#creditCardAuthroziationNo > 0 && this.#isProductAvailable(selection)) {
            this.#payment = price;
            //authroize via ws
        }

        if (this.payment >= price && this.#isProductAvailable(selection)) {
            //this.#processPayment(price);
            this.#payment = this.#payment - price;
            this.#message = 'Enjoy!'
            this.#creditCardAuthroziationNo = 0;
            return this.slots[selection - 1].removeProduct();
        }
        else if (!this.#isProductAvailable(selection)) {
            this.#message = `Sorry! Out of stock`;
            return null;
        }
        else {
            this.#message = `Please add ${price - this.payment}c`
            return null;
        }
    }
    #getAvailableChange() {
        return this.#change.quarters * COIN.QUARTER +
            this.#change.dimes * COIN.DIME +
            this.#change.nickels * COIN.NICKEL;
    }
    releaseChange() {
        let changeToRelease = {
            fives: 0,
            ones: 0,
            quarters: 0,
            dimes: 0,
            nickels: 0
        };
        if (this.#payment > 0) {
            if (this.#getAvailableChange() >= this.#payment) {
                while (this.#payment > 0) {
                    if (this.#payment >= COIN.QUARTER && this.#change.quarters > 0) {
                        this.#change.quarters--;
                        changeToRelease.quarters++;
                        this.#payment = this.#payment - COIN.QUARTER;
                    }
                    else if (this.#payment >= COIN.DIME && this.#change.dimes > 0) {
                        this.#change.dimes--;
                        changeToRelease.dimes++;
                        this.#payment = this.#payment - COIN.DIME;
                    }
                    else if (this.#payment >= COIN.NICKEL && this.#change.nickels > 0) {
                        this.#change.nickels--;
                        changeToRelease.nickels++;
                        this.#payment = this.#payment - COIN.NICKEL;
                    }
                }
                this.#message = 'Please take your change';
            }
            else {
                this.#message = 'Sorry! Out of change';
            }
        }
        else {
            this.#message = 'No change to release';
        }
        return changeToRelease;
    }
    insertBills(bill, times = 1) {
        for (let index = 0; index < times; index++) {
            this.#insertBill(bill);
        }
    }
    insertCoins(coin, times = 1) {
        for (let index = 0; index < times; index++) {
            this.#insertCoin(coin);
        }
    }
    swipeCreditCard(creditCardNo) {
        //authorize creditCardNo    
        this.#creditCardAuthroziationNo = creditCardNo;
        this.#message = 'Credit Card Authorized';
    }
    #insertBill(bill) {
        switch (bill) {
            case 100:
                this.#change.ones++;
                break;
            case 500:
                this.#change.fives++;
                break;
            default:
                throw new Error('Unknown bill: ' + bill);
        }
        this.#payment += bill;
        this.#message = 'Payment: ' + this.#payment;
    }
    #insertCoin(coin) {
        switch (coin) {
            case 25:
                this.#change.quarters++;
                break;
            case 10:
                this.#change.dimes++;
                break;
            case 5:
                this.#change.nickels++;
                break;
            default:
                throw new Error('Unknown coin: ' + coin);
        }
        this.#payment += coin;
        this.#message = 'Payment: ' + this.#payment;
    }
    get message() {
        return this.#message;
    }
    get payment() {
        return this.#payment;
    }
    get id() {
        return this.#id;
    }
    get slots() {
        return this.slots;
    }
    get change() {
        return this.#change;
    }
    get name() {
        return this.#name;
    }
    set name(name) {
        this.#name=name;
    }
    get creditCardAuthroziationNo() {
        return this.#creditCardAuthroziationNo;
    }
    set id(id) {
        this.#id = id;
    }
    
}

export class COIN {
    static #QUARTER = 25;
    static #DIME = 10;
    static #NICKEL = 5;
    static get QUARTER() {
        return COIN.#QUARTER;
    }
    static get DIME() {
        return COIN.#DIME;
    }
    static get NICKEL() {
        return COIN.#NICKEL;
    }
}

export class BILL {
    static #ONE = 100;
    static #FIVE = 500;
    static get ONE() {
        return BILL.#ONE;
    }
    static get FIVE() {
        return BILL.#FIVE;
    }
}
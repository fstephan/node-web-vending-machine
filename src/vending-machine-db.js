import mongoose from 'mongoose';

async function connect() {
    try {
        console.log("About to connect");
        await mongoose.connect("mongodb://127.0.0.1:27017/db-vending-machine", {
            useNewUrlParser: true
        });
        console.log("connected");
        await init();
    }
    catch (err) {
        console.log(err);
    }
    finally {
        console.log("closing");
        mongoose.connection.close();
    }
}

async function init() {
    const Schema = mongoose.Schema;

    const VendingMachineSchema1 = new Schema({
        name: String,
        payment: Number,
        change: { type: Schema.Types.ObjectId, ref: "Change" },
        slots: [{ type: Schema.Types.ObjectId, ref: "Slot" }]
    });
    const SlotSchema1 = new Schema({
        name: String,
        price: Number,
        products: [{ type: Schema.Types.ObjectId, ref: "Product" }]
    });
   

    const ProductSchema = new Schema({
        name: String,
        price: Number
    });
    const SlotSchema = new Schema({
        name: String,
        price: Number,
        products: [ProductSchema]
    });
    const ChangeSchema = new Schema({
        fives: Number,
        ones: Number,
        quarters: Number,
        dimes: Number,
        nickels: Number,
    })
    const VendingMachineSchema = new Schema({
        name: String,
        payment: Number,
        change: ChangeSchema,
        slots: [SlotSchema]
    });

    const VendingMachineDB = mongoose.model("VendingMachine", VendingMachineSchema);
    const SlotDB = mongoose.model("Slot", SlotSchema);
    const ProductDB = mongoose.model("Product", ProductSchema);
    const ChangeDB = mongoose.model("Change", ChangeSchema);

    /*
        let productData = new ProductDB({name:'Coke', price:200});
        //let productData2 = new ProductDB({name:'Mars', price:100});
        await ProductDB.create([
            {name:'Coke', price:200},
            {name:'Mars', price:100}
        ])
       
        let changeData = new ChangeDB({fives: 0, ondes:0, quarters:0, dimes:0, nickels:0});
        await changeData.save();
        let slotData = new SlotDB ({name: 'Coke', price:200, products: productData._id});
        await slotData.save();
        let vendingMachineData = new VendingMachineDB({name: 'Vend1', payment: 0, change: changeData._id, slots: slotData._id });
        await vendingMachineData.save();
    */
    await VendingMachineDB.create({
        name: 'Vend1',
        payment: 0,
        change: new ChangeDB({ fives: 0, ondes: 0, quarters: 0, dimes: 0, nickels: 0 }),
        slots: [new SlotDB(
            {
                name: 'Coke',
                price: 200,
                products: new ProductDB({ name: 'Coke', price: 200 })
            }),
        new SlotDB(
            {
                name: 'Mars',
                price: 100,
                products: new ProductDB({ name: 'Mars', price: 100 })
            })
        ]
    });

    /*
     let vending1 = await VendingMachineDB.findOne({name: 'Vend1'}).populate({path:'slots', populate: {path:'products'}}) ;
     let productData2 = new ProductDB({name:'Mars', price:100});
     let slotData2 = new SlotDB ({name: 'Mars', price:100, products: productData2._id});
     vending1.slots.push({
        slotData2
     })
     await vending1.save();
    
     console.log(vending1); 
    */
    class Product {
        #name;
        #price;
        constructor(name, price) {
            this.#name = name;
            this.#price = price;
        }
        get name() {
            return this.#name;
        }
        get price() {
            return this.#price;
        }
    }

    class Slot {
        #products = [];
        #name;
        #price;
        constructor(name, price) {
            this.#name = name;
            this.#price = price;
        }
        addProducts(product, times = 1) {
            for (let index = 0; index < times; index++) {
                this.#products.push(product);
            }
        }
        removeProduct(product) {
            return this.#products.pop();
        }
        isProductAvailable() {
            return this.#products.length > 0;
        }
        get price() {
            return this.#price;
        }
        get name() {
            return this.#name;
        }
    }

    class VendingMachine {
        #payment = 0;
        #change = {
            fives: 0,
            bills: 0,
            quarters: 0,
            dimes: 0,
            nickels: 0
        };
        slots = [];
        #message;
        #creditCardAuthroziationNo = 0;
        constructor(params) {
            let coke = new Product('Coke', 200);
            let mars = new Product('Mars', 100);
            this.slots[0] = new Slot('Coke', 200);
            this.slots[1] = new Slot('Mars', 100);
            this.slots[0].addProducts(coke, 5);
            this.slots[1].addProducts(mars, 1);
        }
        prefillChange(change) {
            this.#change = change;
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
                //reset
                this.#creditCardAuthroziationNo = 0;
            }
            if (this.payment >= price && this.#isProductAvailable(selection)) {
                //this.#processPayment(price);
                this.#payment = this.#payment - price;
                this.#message = 'Enjoy!'
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
                bills: 0,
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
    }

    class COIN {
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

    class BILL {
        static #ONE = 100;
        static #FIVE = 500;
        static get ONE() {
            return BILL.#ONE;
        }
        static get FIVE() {
            return BILL.#FIVE;
        }
    }
}

connect();
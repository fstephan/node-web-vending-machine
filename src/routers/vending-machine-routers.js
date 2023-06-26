import express from 'express'


export class VendingMachineRouter {
    router;
    constructor(vendingMachineDBManager) {
        const router = new express.Router();
        this.router = router;
        router.use(express.urlencoded({ extended: true }));
        router.use(express.json());
        //home page with list of available vending machines
        router.get('/', async (req, res) => {
            let machines = [];
            const docs = await vendingMachineDBManager.findAll();
            docs.forEach((doc, index) => {
                machines[index] = { name: doc.name, id: doc._id.valueOf() };
            })
            res.render('index', { machines: machines });
        }), (error, req, res, next) => {
            res.status(400).send({ error: error.message })
        };

        //getting 1 vending machine to use
        router.get('/machines/:id/', async (req, res) => {
            let vendingMachine;
            try {
                vendingMachine = await vendingMachineDBManager.retrieve(req.params.id);
            }
            catch (error) {
                console.log(error);
            }

            res.render('vending-machine', {
                id: vendingMachine.id,
                name: vendingMachine.name,
                slots: vendingMachine.slots,
                payment: vendingMachine.payment,
                change: { quarters: 0, dimes: 0, nickels: 0 }
            });
        });

        //updating vending machine configuration
        router.patch('/machines/:id/', async (req, res) => {
            let vendingMachine;
            try {
                vendingMachine = await vendingMachineDBManager.retrieve(req.params.id);
                vendingMachine.name = req.body.name;
                vendingMachine.resetSlots(req.body.numSlots);
                await vendingMachineDBManager.save(vendingMachine);
            }
            catch (error) {
                console.log(error);
            }
            //res.redirect(`/machines/${vendingMachine.id}/admin`)
            res.render('vending-machine-admin', {
                id: vendingMachine.id,
                name: vendingMachine.name,
                slots: vendingMachine.slots,
                payment: vendingMachine.payment,
                change: { quarters: 0, dimes: 0, nickels: 0 }
            });
        });



        //making a payment
        router.patch('/machines/:id/payment', async (req, res) => {
            const body = req.body;
            const coin = body.coin;
            const bill = body.bill;
            const creditCardNo = body.creditCardNo;
            let message = '';
            let vendingMachine;
            try {
                vendingMachine = await vendingMachineDBManager.retrieve(req.params.id);
                if (coin > 0) {
                    vendingMachine.insertCoins(coin - 0);
                    await vendingMachineDBManager.save(vendingMachine);
                    message = vendingMachine.message;
                }
                else if (bill) {
                    vendingMachine.insertBills(bill * 100);
                    await vendingMachineDBManager.save(vendingMachine);
                    message = vendingMachine.message;
                }
                else if (creditCardNo) {
                    vendingMachine.swipeCreditCard(creditCardNo - 0);
                    await vendingMachineDBManager.save(vendingMachine);
                    message = vendingMachine.message;
                }
                else {
                    message = "Invalid payment";
                }
            }
            catch (error) {
                message = error.toString();
            }
            res.send({
                product: '',
                message: message,
                change: {
                    quarters: 0,
                    dimes: 0,
                    nickels: 0
                }
            })
        });

        //making a selection
        router.patch('/machines/:id/selection', async (req, res) => {
            const selection = req.body.selection - 0;
            let product = '';
            let message = '';
            let vendingMachine;
            try {
                vendingMachine = await vendingMachineDBManager.retrieve(req.params.id);
                product = vendingMachine.buyProduct(selection);
                await vendingMachineDBManager.save(vendingMachine);
                message = vendingMachine.message;
            }
            catch (error) {
                message = error.message;
            }
            if (product) {
                product = product.name;
            }
            else {
                product = '';
            }
            res.send({
                product: product,
                message: message,
                change: {
                    quarters: 0,
                    dimes: 0,
                    nickels: 0
                }
            });
        });

        //releasing change
        router.patch('/machines/:id/change', async (req, res) => {
            let vendingMachine;
            vendingMachine = await vendingMachineDBManager.retrieve(req.params.id);
            let change = vendingMachine.releaseChange();
            await vendingMachineDBManager.save(vendingMachine);
            res.send({
                product: '',
                message: vendingMachine.message,
                change: {
                    quarters: change.quarters,
                    dimes: change.dimes,
                    nickels: change.nickels
                }
            })
        });
    }

}




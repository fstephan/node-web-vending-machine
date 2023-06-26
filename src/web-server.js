import express from 'express'
import hbs from 'hbs';
import path from 'path'
import { fileURLToPath } from 'url';
import { createHttpTerminator } from 'http-terminator';
import { VendingMachineRouter } from '../src/routers/vending-machine-routers.js'
import { VendingMachineAdminRouter } from '../src/routers/vending-machine-admin-routers.js'

export class WebServer {
    app;
    #httpTerminator;
    port;
    #vendingMachineDBManager;
    constructor({ port, vendingMachineDBManager }) {
        this.port = port;
        this.#vendingMachineDBManager = vendingMachineDBManager;
        this.#init();
    }
    close() {
        if (this.#httpTerminator) {
            this.#httpTerminator.terminate();
            console.log(`web server on port ${this.port} is shutting down`);
        }
    }
    #init() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const publicDirectoryPath = path.join(__dirname, '../public/');
        const viewsPath = path.join(publicDirectoryPath, '../src/templates/views/');
        const partialsPath = path.join(publicDirectoryPath, '../src/templates/partials/');
        
        this.app = express();
        const router = new express.Router();
        const vendingMachineRouter = new VendingMachineRouter(this.#vendingMachineDBManager);
        const vendingMachineAdminRouter = new VendingMachineAdminRouter(this.#vendingMachineDBManager);
        this.app.use('/',vendingMachineAdminRouter.router);
        this.app.use('/',vendingMachineRouter.router);
        this.app.use(express.static(publicDirectoryPath));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.set('view engine', 'hbs');
        this.app.set('views', viewsPath);
        hbs.registerPartials(partialsPath);

        hbs.registerHelper('isNewRow', function (index) {
            return index % 3 === 0;
        })

        hbs.registerHelper('isEndRow', function (index) {
            return (index + 1) % 3 === 0;
        })

        hbs.registerHelper('isInRow', function (slots) {
            return slots.length%3 !== 0;
        })

        hbs.registerHelper('extraCols', function (context, options) {
            let times=0;
            let cols='';
            while ((context.length+times)%3!== 0) {
                times++;
            }
            for (var i = 0, j = times; i < j; i++) {
                cols = cols + options.fn(context[i]);
            }
            return cols;
        })

        hbs.registerHelper('extraRows', function (context, options) {
            let times=0;
            let rows='';
            if (context.length/3<4) {
                times= 4 - Math.ceil(context.length/3);
            }
            for (var i = 0, j = times; i < j; i++) {
                rows = rows + options.fn(context[i]);
            }
            return rows;
        })

        hbs.registerHelper('slot', function (index) {
            return index+1;
        })

       

        // //home page with list of available vending machines
        // this.app.get('/', async (req, res) => {
        //     let machines = [];
        //     try {
        //         const docs = await this.#vendingMachineDBManager.findAll();
        //         docs.forEach((doc, index) => {
        //             machines[index] = { name: doc.name, id: doc._id.valueOf() };
        //         })
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }
        //     res.render('index', { machines: machines });
        // });

        // //admin - create
        // this.app.get('/machines/admin', async (req, res) => {
        //     res.render('vending-machine-admin', {
        //         slots: []
        //     });
        // });

        // //getting 1 vending machine to use
        // this.app.get('/machines/:id/', async (req, res) => {
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }

        //     res.render('vending-machine', {
        //         id: vendingMachine.id,
        //         name: vendingMachine.name,
        //         slots: vendingMachine.slots,
        //         payment: vendingMachine.payment,
        //         change: { quarters: 0, dimes: 0, nickels: 0 }
        //     });
        // });

        // this.app.delete('/machines/:id/', async (req, res) => {
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.delete(req.params.id);
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }
        //     res.send();
        // });

        // //updating vending machine configuration
        // this.app.patch('/machines/:id/', async (req, res) => {
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //         vendingMachine.name = req.body.name;
        //         vendingMachine.resetSlots(req.body.numSlots);
        //         await this.#vendingMachineDBManager.save(vendingMachine);
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }
        //     //res.redirect(`/machines/${vendingMachine.id}/admin`)
        //     res.render('vending-machine-admin', {
        //         id: vendingMachine.id,
        //         name: vendingMachine.name,
        //         slots: vendingMachine.slots,
        //         payment: vendingMachine.payment,
        //         change: { quarters: 0, dimes: 0, nickels: 0 }
        //     });
        // });

        // //getting the admin to update a vending machine
        // this.app.get('/machines/:id/admin', async (req, res) => {
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }
        //     res.render('vending-machine-admin', {
        //         name: vendingMachine.name,
        //         slots: vendingMachine.slots,
        //         payment: vendingMachine.payment,
        //         change: vendingMachine.change
        //     });
        // });

        // //creating a vending machine
        // this.app.post('/machines/', async (req, res) => {
        //     console.log('creating');
        //     let vendingMachine;
        //     try {
        //         vendingMachine = new VendingMachine({ name: req.body.name, numSlots: req.body.numSlots })
        //         await this.#vendingMachineDBManager.create(vendingMachine);
        //         console.log(vendingMachine.id);
        //         res.send({
        //             id: vendingMachine.id,
        //             name: vendingMachine.name,
        //             slots: vendingMachine.slots
        //         });
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }
        // });

        // //updating the slots in the vending machine
        // this.app.patch('/machines/:id/slots', async (req, res) => {
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //         const body = req.body;
        //         vendingMachine.configureSlot(body.slotNo, body.name, body.price);
        //         await this.#vendingMachineDBManager.save(vendingMachine);
        //         res.send({
        //             id: vendingMachine.id,
        //             name: vendingMachine.name,
        //             slots: vendingMachine.slots
        //         });
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }
        // });

        // //updating the products in the vending machine
        // this.app.patch('/machines/:id/products', async (req, res) => {
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //         const body = req.body;
        //         const slotNo = body.slotNo;
        //         const name = body.name;
        //         const quantity = body.quantity;
        //         const price = body.price || vendingMachine.slots[slotNo - 1].price;
        //         vendingMachine.addProductsToSlot(slotNo, { name, price }, quantity);
        //         await this.#vendingMachineDBManager.save(vendingMachine);
        //         res.send({
        //             id: vendingMachine.id,
        //             name: vendingMachine.name,
        //             slots: vendingMachine.slots
        //         });
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }
        // });

        // //cashing out
        // this.app.patch('/machines/:id/cash', async (req, res) => {
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //         const cash = vendingMachine.cashOut();
        //         await this.#vendingMachineDBManager.save(vendingMachine);
        //         res.send({
        //             id: vendingMachine.id,
        //             name: vendingMachine.name,
        //             slots: vendingMachine.slots,
        //             cash: cash
        //         })
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }
        // });

        // //adding coins for change
        // this.app.patch('/machines/:id/coins', async (req, res) => {
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //         const body = req.body;
        //         vendingMachine.addCoinsForChange(25, body.quarters);
        //         vendingMachine.addCoinsForChange(10, body.dimes);
        //         vendingMachine.addCoinsForChange(5, body.nickels);
        //         await this.#vendingMachineDBManager.save(vendingMachine);
        //         res.send({
        //             id: vendingMachine.id,
        //             name: vendingMachine.name,
        //             slots: vendingMachine.slots
        //         })
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }
        // });

        // //making a payment
        // this.app.patch('/machines/:id/payment', async (req, res) => {
        //     const body = req.body;
        //     const coin = body.coin;
        //     const bill = body.bill;
        //     const creditCardNo = body.creditCardNo;
        //     let message = '';
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //         if (coin > 0) {
        //             vendingMachine.insertCoins(coin - 0);
        //             await this.#vendingMachineDBManager.save(vendingMachine);
        //             message = vendingMachine.message;
        //         }
        //         else if (bill) {
        //             vendingMachine.insertBills(bill * 100);
        //             await this.#vendingMachineDBManager.save(vendingMachine);
        //             message = vendingMachine.message;
        //         }
        //         else if (creditCardNo) {
        //             vendingMachine.swipeCreditCard(creditCardNo - 0);
        //             await this.#vendingMachineDBManager.save(vendingMachine);
        //             message = vendingMachine.message;
        //         }
        //         else {
        //             message = "Invalid payment";
        //         }
        //     }
        //     catch (error) {
        //         message = error.toString();
        //     }
        //     res.send({
        //         product: '',
        //         message: message,
        //         change: {
        //             quarters: 0,
        //             dimes: 0,
        //             nickels: 0
        //         }
        //     })
        // });

        // //making a selection
        // this.app.patch('/machines/:id/selection', async (req, res) => {
        //     const selection = req.body.selection - 0;
        //     let product = '';
        //     let message = '';
        //     let vendingMachine;
        //     try {
        //         vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //         product = vendingMachine.buyProduct(selection);
        //         await this.#vendingMachineDBManager.save(vendingMachine);
        //         message = vendingMachine.message;
        //     }
        //     catch (error) {
        //         message = error.toString();
        //     }
        //     if (product) {
        //         product = product.name;
        //     }
        //     else {
        //         product = '';
        //     }
        //     res.send({
        //         product: product,
        //         message: message,
        //         change: {
        //             quarters: 0,
        //             dimes: 0,
        //             nickels: 0
        //         }
        //     });
        // });

        // //releasing change
        // this.app.patch('/machines/:id/change', async (req, res) => {
        //     let vendingMachine;
        //     vendingMachine = await this.#vendingMachineDBManager.retrieve(req.params.id);
        //     let change = vendingMachine.releaseChange();
        //     await this.#vendingMachineDBManager.save(vendingMachine);
        //     res.send({
        //         product: '',
        //         message: vendingMachine.message,
        //         change: {
        //             quarters: change.quarters,
        //             dimes: change.dimes,
        //             nickels: change.nickels
        //         }
        //     })
        // });

        //all others
        this.app.get('*', (req, res) => {
            res.sendFile(publicDirectoryPath + '/404.html');
        })

        const server = this.app.listen(this.port, () => {
            console.log(`web server listening on port ${this.port}`)
            this.#httpTerminator = createHttpTerminator({ server });
        })
    }
}

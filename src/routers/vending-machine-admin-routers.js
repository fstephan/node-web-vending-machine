import express from 'express'
import { VendingMachine } from '../../src/vending-machine.js'

export class VendingMachineAdminRouter {
    router;
    constructor(vendingMachineDBManager) {
        const router = new express.Router();
        router.use(express.urlencoded({ extended: true }));
        router.use(express.json());
        this.router = router;
        //admin - create
        router.get('/machines/admin', async (req, res) => {
            res.render('vending-machine-admin', {
                slots: []
            });
        });
        
        //delete
        router.delete('/machines/:id/', async (req, res) => {
            const vendingMachine = await  vendingMachineDBManager.delete(req.params.id);
            res.status(200).send();
        }), (error, req, res, next)=> {
            res.status(400).send({error: error.message})
        };

        //updating vending machine configuration
        router.patch('/machines/:id/', async (req, res) => {
            let vendingMachine;
            try {
                vendingMachine = await  vendingMachineDBManager.retrieve(req.params.id);
                vendingMachine.name = req.body.name;
                vendingMachine.resetSlots(req.body.numSlots);
                await  vendingMachineDBManager.save(vendingMachine);
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

        //getting the admin to update a vending machine
        router.get('/machines/:id/admin', async (req, res) => {
            let vendingMachine;
            try {
                vendingMachine = await  vendingMachineDBManager.retrieve(req.params.id);
            }
            catch (error) {
                console.log(error);
            }
            res.render('vending-machine-admin', {
                name: vendingMachine.name,
                slots: vendingMachine.slots,
                payment: vendingMachine.payment,
                change: vendingMachine.change
            });
        });

        //creating a vending machine
        router.post('/machines/', async (req, res) => {
            let vendingMachine;
            try {
                vendingMachine = new VendingMachine({ name: req.body.name, numSlots: req.body.numSlots })
                await  vendingMachineDBManager.create(vendingMachine);
                res.send({
                    id: vendingMachine.id,
                    name: vendingMachine.name,
                    slots: vendingMachine.slots
                });
            }
            catch (error) {
                console.log(error);
            }
        });

        //updating the slots in the vending machine
        router.patch('/machines/:id/slots', async (req, res) => {
            let vendingMachine;
            try {
                vendingMachine = await  vendingMachineDBManager.retrieve(req.params.id);
                const body = req.body;
                vendingMachine.configureSlot(body.slotNo, body.name, body.price);
                await  vendingMachineDBManager.save(vendingMachine);
                res.send({
                    id: vendingMachine.id,
                    name: vendingMachine.name,
                    slots: vendingMachine.slots
                });
            }
            catch (error) {
                console.log(error);
            }
        });

        //updating the products in the vending machine
        router.patch('/machines/:id/products', async (req, res) => {
            let vendingMachine;
            try {
                vendingMachine = await  vendingMachineDBManager.retrieve(req.params.id);
                const body = req.body;
                const slotNo = body.slotNo;
                const name = body.name;
                const quantity = body.quantity;
                const price = body.price || vendingMachine.slots[slotNo - 1].price;
                vendingMachine.addProductsToSlot(slotNo, { name, price }, quantity);
                await  vendingMachineDBManager.save(vendingMachine);
                res.send({
                    id: vendingMachine.id,
                    name: vendingMachine.name,
                    slots: vendingMachine.slots
                });
            }
            catch (error) {
                console.log(error);
            }
        });

        //cashing out
        router.patch('/machines/:id/cash', async (req, res) => {
            let vendingMachine;
            try {
                vendingMachine = await  vendingMachineDBManager.retrieve(req.params.id);
                const cash = vendingMachine.cashOut();
                await  vendingMachineDBManager.save(vendingMachine);
                res.send({
                    id: vendingMachine.id,
                    name: vendingMachine.name,
                    slots: vendingMachine.slots,
                    cash: cash
                })
            }
            catch (error) {
                console.log(error);
            }
        });

        //adding coins for change
        router.patch('/machines/:id/coins', async (req, res) => {
            let vendingMachine;
            try {
                vendingMachine = await  vendingMachineDBManager.retrieve(req.params.id);
                const body = req.body;
                vendingMachine.addCoinsForChange(25, body.quarters);
                vendingMachine.addCoinsForChange(10, body.dimes);
                vendingMachine.addCoinsForChange(5, body.nickels);
                await  vendingMachineDBManager.save(vendingMachine);
                res.send({
                    id: vendingMachine.id,
                    name: vendingMachine.name,
                    slots: vendingMachine.slots
                })
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}

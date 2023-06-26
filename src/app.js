import {WebServer} from './web-server.js'
import {VendingMachineDBManager} from './vending-machine.js' 

const port = process.env.PORT;
const uri = process.env.DB_CONNECTION;
const database = process.env.DATABASE_NAME;
const vendingMachineDBManager=new VendingMachineDBManager(uri, database);

new WebServer({port,vendingMachineDBManager});


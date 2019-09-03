import {Command} from './command';
import {HttpService, HttpServiceConfig} from './httpservice';
import inquirer = require('inquirer');
import { PrettyError } from './prettyerror';
import { Util } from './util';

export class Create extends Command {
    private spList: Array<String> = ['BankOfBrusselsSP', 'CopenhagenBankSP', 'DublinBankSP'];
    httpService: HttpService;
    constructor(dataStore, answers: {[key: string]: any}) {
        super(dataStore, [], answers);
        const httpConfig: HttpServiceConfig = {
            host: 'http://localhost',
            port: process.env.EP_CLI_PORT,
            baseUrl: '/api'
        };
        this.httpService = new HttpService(httpConfig);

        if (process.env.SP_LIST) {
            this.spList = process.env.SP_LIST.split(",").map((item) => item.trim());
        }
    }

    public async questions() {
        const createAnswers: any = await inquirer.prompt([
            {
                type: 'list',
                name: 'assetType',
                message: 'What would you like to create?',
                choices: ['Purchase Orders', 'Finance Requests', 'Shipments']
            },
        ]);
        switch (createAnswers.assetType.replace(' ', '')) {
            case 'PurchaseOrders':
                return await this.createPurchaseOrderQuestions();
            case 'FinanceRequests':
                return await this.createFinanceRequestQuestions();
            case 'Shipments':
                return await this.createShipmentQuestions();
        }
    }

    private async createPurchaseOrderQuestions() {
        const createAnswers: any = await inquirer.prompt([
            {
                type: 'text',
                name: 'sellerId',
                message: 'Who are you buying goods from?'
            },
            {
                type: 'text',
                name: 'price',
                message: 'How much is each unit?'
            },
            {
                type: 'text',
                name: 'units',
                message: 'How many units?'
            },
            {
                type: 'text',
                name: 'productDescriptor',
                message: 'What is the purchase order for?'
            }
        ]);
        return this.createPurchaseOrder(createAnswers);
    }

    private async createPurchaseOrder(createAnswers) {
        return this.httpService.post('purchaseorders', Object.assign({buyerId: this.dataStore.auth}, createAnswers), {user: this.dataStore.auth});
    }

    private async createFinanceRequestQuestions() {
        let purchaseOrders = await this.httpService.get('purchaseorders', {user: this.dataStore.auth});

        purchaseOrders = purchaseOrders.filter((po) => {
            return po.status === 'APPROVED' && po.sellerId === this.dataStore.auth;
        });

        if (purchaseOrders.length === 0) {
            throw new PrettyError('No purchase orders available');
        }
        const createAnswers: any = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'financierIds',
                message: "Who are you requesting finance from? (minimum of 1)",
                choices: this.spList,
                validate: (answers) => {
                    if (answers.length === 0) {
                        return 'Minimum of 1 financier required'
                    }

                    return true;
                }
            },
            {
                type: 'list',
                name: 'purchaseOrderId',
                choices: purchaseOrders.map(po => po.id),
                message: 'Which purchase order would you like finance for?'
            },
            {
                type: 'text',
                name: 'amount',
                message: 'How much finance would you like?'
            },
            {
                type: 'text',
                name: 'interest',
                message: 'What is your desired interest rate?'
            },
            {
                type: 'text',
                name: 'monthLength',
                message: 'How long do you want to pay the finance back over?'
            }
        ]);

        createAnswers.requesterId = this.dataStore.auth;

        const financeRequestGroup = await this.createFinanceRequest(createAnswers);

        let fullFrg;

        for (let i = 0; i < 5; i++) {
            try {
                fullFrg = await this.httpService.get(`financerequests/group/hash/${financeRequestGroup.hash}`, {user: this.dataStore.auth});
                break;
            } catch (e) {
                if (i == 4) {
                    throw e;
                }

                await Util.sleep(2000);
            }
        }

        return fullFrg;
    }

    private async createFinanceRequest(createAnswers) {
        return this.httpService.post('financerequests', Object.assign({requesterId: this.dataStore.auth}, createAnswers), {user: this.dataStore.auth})
    }

    private async createShipmentQuestions() {
        let purchaseOrders = await this.httpService.get('purchaseorders', {user: this.dataStore.auth});
        purchaseOrders = purchaseOrders.filter((po) => {
            return po.status === 'APPROVED' && po.sellerId === this.dataStore.auth;
        });
        const createAnswers: any = await inquirer.prompt([
            {
                type: 'list',
                name: 'purchaseOrderId',
                message: 'Which purchase order are you shipping?',
                choices: purchaseOrders.map((po) => po.id)
            },
            {
                type: 'text',
                name: 'units',
                message: 'How many units are you shipping?'
            }
        ]);
        const myOrders = purchaseOrders.filter((po) => po.id === createAnswers.purchaseOrderId)
        if (myOrders.length === 0) {
            throw new PrettyError('No purchase orders available');
        }
        createAnswers.receiverId = myOrders[0].buyerId;
        return this.createShipment(createAnswers);
    }

    private async createShipment(createAnswers) {
        return this.httpService.post('shipments', Object.assign({senderId: this.dataStore.auth}, createAnswers), {user: this.dataStore.auth});
    }
}

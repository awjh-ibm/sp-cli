import { Command } from "./command";
import { HttpService, HttpServiceConfig } from "./httpservice";
import inquirer = require("inquirer");
import { PrettyDisplay } from "./prettydisplay";
import { PrettyError } from "./prettyerror";
import { Util } from "./util";

export class Other extends Command {
    httpService: HttpService;
    constructor(dataStore, answers: {[key: string]: any}) {
        super(dataStore, [], answers);
        const httpConfig: HttpServiceConfig = {
            host: 'http://localhost',
            port: process.env.EP_CLI_PORT,
            baseUrl: '/api'
        };
        this.httpService = new HttpService(httpConfig);
    }

    public async questions() {
        const otherAnswers: any = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: ['Manage Purchase Order', 'Manage Finance Request', 'Manage Shipment', 'Go back']
            }
        ]);

        const action = otherAnswers.action;

        switch (action) {
            case 'Manage Purchase Order':
                return this.managePurchaseOrder();
            case 'Manage Finance Request':
                return this.manageFinanceRequest();
            case 'Manage Shipment':
                break;
            case 'Go back':
                return 'BACK';
        }
    }

    private async managePurchaseOrder() {
        let purchaseOrders = await this.httpService.get('purchaseorders', {user: this.dataStore.auth});
        purchaseOrders = purchaseOrders.filter((po) => {
            return po.status === 'PENDING' && po.sellerId === this.dataStore.auth;
        });
        if (purchaseOrders.length === 0) {
            throw new PrettyError('No purchase orders to manage');
        }

        const manageAnswers: any = await inquirer.prompt([
            {
                type: 'list',
                name: 'purchaseOrderId',
                message: 'Which purchase order do you want to manage?',
                choices: purchaseOrders.map(p => p.id)
            }
        ]);
        const purchaseOrderId = manageAnswers.purchaseOrderId;
        const purchaseOrder = purchaseOrders.filter(p => p.id === purchaseOrderId)[0];
        const table = new PrettyDisplay(purchaseOrder);
        console.log(table.toString());

        const questions = [];

        if (purchaseOrder.status === 'PENDING' && purchaseOrder.sellerId === this.dataStore.auth) {
            questions.push(
                {
                    type: 'list',
                    name: 'action',
                    message: 'What do you want to do?',
                    choices: ['Approve Purchase Order', 'Close Purchase Order']
                }
            );
        }

        const poActions: any = await inquirer.prompt(questions);

        switch (poActions.action) {
            case 'Approve Purchase Order':
                await this.httpService.put(`purchaseorders/${purchaseOrder.id}/accept`, {user: this.dataStore.auth});
                break;
            case 'Close Purchase Order':
                await this.httpService.put(`purchaseorders/${purchaseOrder.id}/close`, {user: this.dataStore.auth});
                break;
        }
        // TODO - Why is this needed? change to po should have been committed before get is ever called
        await Util.sleep(2000);
        return this.httpService.get(`purchaseorders/${purchaseOrder.id}`, {user: this.dataStore.auth})
    }

    private async manageFinanceRequest() {
        const financeRequests = await this.httpService.get('financerequests', {user: this.dataStore.auth});
        if (financeRequests.length === 0) {
            throw new PrettyError('No finance requests to manage');
        }
        const manageAnswers: any = await inquirer.prompt([
            {
                type: 'list',
                name: 'financeRequestId',
                message: 'Which finance request do you want to manage?',
                choices: financeRequests.map(p => p.id)
            }
        ]);
        const financeRequestId = manageAnswers.financeRequestId;
        const financeRequest = financeRequests.filter(f => f.id === financeRequestId)[0];
        const table = new PrettyDisplay(financeRequest);
        console.log(table.toString());

        /**
         *  PENDING,
            APPROVED,
            REJECTED,
            WITHDRAWN,
            ACCEPTED
         */
        const questions = [];

        switch (financeRequest.status) {
            case 'PENDING':
                if (financeRequest.requesterId === this.dataStore.auth) {
                    // if it is me
                    questions.push({
                        type: 'list',
                        name: 'action',
                        choices: ['Withdraw'],
                        message: 'Which purchase order would you like finance for?'
                    });
                }
                break;
            case 'APPROVED':
                break;
            case 'REJECTED':
                break;
            case 'WITHDRAWN':
                break;
            case 'ACCEPTED':
                break;
        }

        // const actionAnswers = await inquirer.prompt(questions);

        // return this.httpService.put('')
    }
}

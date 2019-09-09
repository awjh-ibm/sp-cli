import { Command } from "./command";
import { HttpService, HttpServiceConfig } from "./httpservice";
import { PrettyDisplay } from "./prettydisplay";
import { PrettyError } from "./prettyerror";
import inquirer = require("inquirer");
import 'colors';

export class Other extends Command {
    httpService: HttpService;
    constructor(dataStore, answers: {[key: string]: any}) {
        super(dataStore, [], answers);
        const httpConfig: HttpServiceConfig = {
            host: 'http://localhost',
            port: process.env.SP_CLI_PORT,
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
                choices: ['Manage Finance Request', 'Go back']
            }
        ]);

        const action = otherAnswers.action;

        switch (action) {
            case 'Manage Finance Request':
                return this.manageFinanceRequest();
            case 'Manage Shipment':
                break;
            case 'Go back':
                return 'BACK';
        }
    }

    private async manageFinanceRequest() {
        let financeRequests = await this.httpService.get('financerequests', {user: this.dataStore.financierId});

        financeRequests = financeRequests.filter((fr) => {
            return fr.financierId === this.dataStore.financierId && fr.status === 'PENDING';
        });

        if (financeRequests.length === 0) {
            throw new PrettyError('No finance requests to manage');
        }

        const table = new PrettyDisplay(financeRequests);
        table.display();

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
                if (financeRequest.financierId === this.dataStore.financierId) {
                    // if it is me
                    questions.push({
                        type: 'list',
                        name: 'action',
                        choices: ['Approve', 'Reject'],
                        message: 'What would you like to do with the finance request?'
                    });
                }
                break;
        }

        const actionAnswers: any = await inquirer.prompt(questions);

        switch (actionAnswers.action) {
            case 'Approve':
                await this.validatePurchaseOrder(financeRequest);
                await this.httpService.put(`financerequests/${financeRequest.id}/approve`, {}, {user: this.dataStore.financierId});
                break;
            case 'Reject':
                await this.httpService.put(`financerequests/${financeRequest.id}/reject`, {}, {user: this.dataStore.financierId});
                break;
        }
        return this.httpService.get(`financerequests/${financeRequest.id}`, {user: this.dataStore.financierId});
    }

    async getPurchaseOrderInfo() {
        return await inquirer.prompt([
            {
                type: 'text',
                name: 'buyerId',
                message: 'Who is buying the goods?'
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
    }

    async validatePurchaseOrder(fr) {
        const purchaseOrder: any = await this.getPurchaseOrderInfo();
        purchaseOrder.id = fr.purchaseOrderId;
        purchaseOrder.sellerId = fr.requesterId;
        purchaseOrder.status = 'APPROVED';
        let resp;
        try {
            resp = await this.httpService.post('purchaseorders/verify', purchaseOrder, {});
            const table = new PrettyDisplay([{'Verified': '✔'.green}])
            table.display();
        } catch (err) {
            resp = err;
            const table = new PrettyDisplay([{'Verified': '✗'.red}])
            table.display();
            throw err;
        }
        return resp;
    }
}

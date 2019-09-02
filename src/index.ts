import inquirer = require("inquirer");
import {CommandRouter} from './commandrouter';
import { PrettyError } from "./prettyerror";


const dataStore = {
    auth: null
};

async function questionBuilder() {
    if (dataStore.auth === null) {
        return login()
    } else {
        // return Promise.resolve({});
        return highLevelActions();
    }
}

async function run() {
    console.log('Welcome to the We.Trade POC (Enrolling Party)')
    while (true) {
        const answers: any = await questionBuilder();
        if (answers.hasOwnProperty('username')) {
            dataStore.auth = answers.username;
        } else {
            try {
                await CommandRouter.route(dataStore, answers)
            } catch (err) {
                if (err instanceof PrettyError) {
                    console.log(err.toTable());
                } else {
                    console.log(err);
                }
                await CommandRouter.route(dataStore, answers);
            }
        }
    }
}

function login() {
    return inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: 'What is your username?'
        },
        {
            type: 'password',
            name: 'password',
            message: 'What is your password?'
        },
    ]);
}

function highLevelActions() {
    return inquirer.prompt([
        {
            type: 'list',
            name: 'highLevel',
            message: 'Which action do you want to do?',
            choices: ['Create', 'Read', 'Other']
        },
    ]);
}
run();

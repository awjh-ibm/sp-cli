import inquirer = require("inquirer");
import {CommandRouter} from './commandrouter';


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
    console.log('Welcome to the We.Trade POC (Service Provider)')
    while (true) {
        const answers: any = await questionBuilder();
        if (answers.hasOwnProperty('username')) {
            dataStore.auth = answers.username;
        } else {
            await CommandRouter.route(dataStore, answers)
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

export class Command {

    answers: any;
    dataStore: any;
    requiredArgs: string[];

    constructor(dataStore, requiredArgs: string[], answers: any) {
        this.dataStore = dataStore;
        this.requiredArgs = requiredArgs;
        this.answers = answers;

        this.hasRequiredArgs();
    }

    public isLoggedIn() {
        return this.dataStore.auth !== null;
    }

    private hasRequiredArgs() {
        for (const arg in this.requiredArgs) {
            if (!this.answers.hasOwnProperty(arg) && this.answers[arg] !== null) {
                throw new Error(`Missing arg ${arg}`);
            }
        }
    }
}

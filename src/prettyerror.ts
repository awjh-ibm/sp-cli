import { PrettyDisplay } from './prettydisplay';

export class PrettyError extends Error {
    constructor(error) {
        if (error) {
            if (error.detailMessage) {
                super(error.detailMessage);
            } else {
                super(error);
            }
        } else {
            console.log(error);
            super('Some error occured');
        }
    }

    toTable() {
        const table = new PrettyDisplay([{[this.name]: this.message}]);
        return table.toString();
    }
}

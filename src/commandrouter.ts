import { Read } from "./read";
import { PrettyDisplay } from './prettydisplay';

export class CommandRouter {

    public static async route(dataStore, answers: {[key: string]: any}) {
        const highLevel: string = answers.highLevel;

        switch (highLevel) {
            case 'Create':
                break;
            case 'Read':
                const read = new Read(dataStore, answers);
                const data = await read.questions();
                const table = new PrettyDisplay(data);
                console.log(table.toString());
                break;
            case 'Other':
                break;
        }
    }
}

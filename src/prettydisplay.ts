import Table = require('cli-table');


export class PrettyDisplay extends Table {
    constructor(data: {[key: string]: any}[]) {
        if (!data || data.length === 0) {
            super();
            this.push(['No data']);
        } else {
            super({
                head: PrettyDisplay.getHead(data)
            });
            this.push(...this.cleanData(data));
        }
    }

    private cleanData(data: {[key: string]: any}[]) {
        for (const d of data) {
            for (const key in d) {
                if (typeof key !== 'string') {
                    d[key] = JSON.stringify(d[key]);
                }
            }
        }
        return PrettyDisplay.getValues(data);
    }

    private static getHead(data: {[key: string]: any}[]) {
        return Object.keys(data[0]);
    }

    private static getValues(data: {[key: string]: any}[]) {
        const dataArray: string[][] = [];
        for (const d of data) {
            const values = Object.keys(d).map(key => d[key]);
            dataArray.push(values);
        }
        return dataArray;
    }
}

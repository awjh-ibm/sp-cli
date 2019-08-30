import request = require("request-promise-native");

export interface HttpServiceConfig {
    host: string,
    port: string,
    baseUrl: string
}

export class HttpService {
    config: HttpServiceConfig;
    public constructor(config: HttpServiceConfig) {
        this.config = config;
    }

    public async get(endpoint: string, options: any = {}) {
        const {user} = options;
        const response = await request
            .get({
                method: 'GET',
                url: this.buildUri(endpoint),
                body: JSON.stringify({
                    user
                })
            })
        return JSON.parse(response).data;
    }

    public async post(endpoint: string, body: {[key: string]: any}, options: any = {}) {
        const {user} = options;
        const response = await request
                .post(this.buildUri(endpoint), {body: JSON.stringify(Object.assign({user}, body))})
        return JSON.parse(response).data;
    }

    public async put(endpoint: string, body: {[key: string]: any}, options: any = {}) {
        const {user} = options;
        const response = await request
                .put(this.buildUri(endpoint), {body: JSON.stringify(Object.assign({user}, body))})
        return JSON.parse(response).data;
    }

    private buildUri(endpoint: string) {
        return `${this.config.host}:${this.config.port}${this.config.baseUrl}/${endpoint}`;
    }
}

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

    public async get(endpoint: String) {
        const response = await request
                .get(this.buildUri(endpoint))
        return JSON.parse(response).data;
    }

    private buildUri(endpoint: String) {
        return `${this.config.host}:${this.config.port}${this.config.baseUrl}/${endpoint}`;
    }
}

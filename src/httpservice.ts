import request = require("request-promise-native");
import { PrettyError } from "./prettyerror";

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

    public async get(endpoint: string, options: any = {}, body: any = {}) {
        const {user} = options;
        let response;
        try {
            response = await request
                .get({
                    method: 'GET',
                    url: this.buildUri(endpoint),
                    body: JSON.stringify(Object.assign({
                        user,
                        behalfOfId: user
                    }, body))
                })
            response = JSON.parse(response);
        } catch (err) {
            response = err;
        }
        this.handlerError(response);
        return response.data;
    }

    public async post(endpoint: string, body: {[key: string]: any}, options: any = {}) {
        const {user} = options;
        let response;
        try {
            response = await request
                .post(this.buildUri(endpoint), {body: JSON.stringify(Object.assign({user}, body))})
            response = JSON.parse(response);
       } catch (err) {
            response = err;
        }
        this.handlerError(response);
        return response.data;
    }

    public async put(endpoint: string, body: {[key: string]: any}, options: any = {}) {
        const {user} = options;
        let response;
        try {
        response = await request
                .put(this.buildUri(endpoint), {body: JSON.stringify(Object.assign({user}, body))})
        response = JSON.parse(response);
        } catch (err) {
            response = err;
        }
        this.handlerError(response);
        return response.data;
    }

    private buildUri(endpoint: string) {
        return `${this.config.host}:${this.config.port}${this.config.baseUrl}/${endpoint}`;
    }

    private handlerError(response) {
        if (typeof response === 'string') {
            response = JSON.parse(response);
        }
        if (response.status === 'ERROR' || response.error) {
            throw new PrettyError(response.message || "An error occurred");
        }
    }
}

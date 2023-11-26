import config from './config';
import axios, {AxiosError} from 'axios';
import {LocalStorage} from '../index';

/**
 * Automatically includes token.
 *
 * @param path of the API call.
 * @param data to be given to the API.
 */
export async function Post(path: string, data?: any) {
    try {
        return axios.post(`${config.server}/${config.apiParent}/${path}`, data, {
            headers: {
                Authorization: LocalStorage.getUser()?.token
            }
        });
    } catch (e) {
        const ee = e as AxiosError;

        return {
            status: ee.response?.status,
            data: ee.response?.data
        };
    }
}

/**
 * Automatically includes token.
 *
 * @param path of the API call.
 * @param data to be given to the API.
 */
export async function Delete(path: string, data?: any) {
    try {
        return await axios.delete(`${config.server}/${config.apiParent}/${path}`,{
            headers: {
                Authorization: LocalStorage.getUser()?.token
            },
            data: data
        });
    } catch (e) {
        return e;
    }
}

/**
 * Automatically includes token.
 *
 * @param path of the API call.
 */
export async function Get(path: string) {
    try {
        return axios.get(`${config.server}/${config.apiParent}/${path}`, {
            headers: {
                Authorization: LocalStorage.getUser()?.token
            },
        });
    } catch (e) {
        return e;
    }
}

import config from './config';
import axios, {AxiosError} from 'axios';
import {LocalStorage} from '../index';

/*
 * Make sure you modify this for production.
 * Allow self-signed SSL certificate to work.
 * */
const axiosInstance = axios.create({
    // REMOVE THIS FOR PRODUCTION
    httpsAgent: {
        ...axios.defaults.httpsAgent,
        ca: [`-----BEGIN CERTIFICATE-----
MIIDTDCCAjSgAwIBAgIFNzkxNTcwDQYJKoZIhvcNAQELBQAwXjEQMA4GA1UEAxMH
VGVzdCBDQTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNV
BAcTDVNhbiBGcmFuY2lzY28xEDAOBgNVBAoTB1Rlc3QgQ0EwHhcNMjMxMjIwMTI0
OTE1WhcNMjQxMjE5MTI0OTE1WjAUMRIwEAYDVQQDEwlsb2NhbGhvc3QwggEiMA0G
CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDKDJX7FHSGz4Ya86Y64ruznZgGKoxA
5DOYhxuWHUXJA+lJq20Te4g8zViRqdjHU+3eL7iIz214W6f0HgGRP37EO9V26uYo
AByunPhiZvpedutDlj34z0OsRcqYNQJc07u+uplvCzfLXFuuwxJ5AOyy/x+qs/l6
pIYMM0/Cy59PtTSL3SszTBiQ82dl1yxS/kKRgOreaqRRFpT6HjBVX3Yc6M3BmBjO
1KCdmZ8pok3NrZWVYSHXVAqimjey5TdnKc6AbtvOX/HsHgUfEcLP9JCuDYc80lYx
QQ6jSQg0eq/+3MuoIQ+NTzfu7Cb0pvXU5ootN1Ky2dIme8ORL9APPyA1AgMBAAGj
WzBZMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsG
AQUFBwMBBggrBgEFBQcDAjAaBgNVHREEEzARgglsb2NhbGhvc3SHBH8AAAEwDQYJ
KoZIhvcNAQELBQADggEBAAKUTjTUj11F9M7HcQGhmUTVzkkBAjLkxy27OxGNYNv4
ln6sYW9ERcQ0K86ZC4xkPVH0/3jSOYssWaCDPM1NGv4NyPdeS12msEe007FDR4dP
1zkMXgXd1wuc1FFtMdvNXI9pavKC1hD0ckYi7v9Z1otxubkcrMKP0iiHmdoP8Oqh
Rxb0LUZsW+kF/pLqQwhsqbFmxNzjd9qOM/MtivwRbiQv/YOLY9XqEex7PQ1R+fNh
iospj4KPHFv1U5OzkK/Je2ZUSia104JAJzg55hElfPyQyuX0MjUAu/dGNC0rVYuP
KnHU808/vvWiHFyjuom6XhCGBwDSw0gUmNuR0f+VQVo=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDXzCCAkegAwIBAgIGMTMyNDgwMA0GCSqGSIb3DQEBCwUAMF4xEDAOBgNVBAMT
B1Rlc3QgQ0ExCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYD
VQQHEw1TYW4gRnJhbmNpc2NvMRAwDgYDVQQKEwdUZXN0IENBMB4XDTIzMTIyMDEy
NDkwOVoXDTI0MTIxOTEyNDkwOVowXjEQMA4GA1UEAxMHVGVzdCBDQTELMAkGA1UE
BhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBGcmFuY2lz
Y28xEDAOBgNVBAoTB1Rlc3QgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK
AoIBAQDnZAuWzfvzXDavoXI1r6QfjnLpmFudBJvTgejTSUs2Iyh8uGRzOTOiKrH2
2OGsDfYLsK4sAmOC7ISw0WonhbA2jCcHb3ZH/rCNWjhANb2pWI0k3xi1s1trinVf
KCXbSarJDTdmi4Ex0PGp/XFc1eiROIHc8J/9++cd/o3vA+aNQmJGAHblLRavNc4A
M7slD3UOpjZaq7KiNO9Xl3aTUt5FaZMPA5EqhAVeqN0MB7Q+DnHkweU06VBmcATa
Jp7+lH/HQ+XrcCrk129kyciRYAHUC8qyvr+d1r/fUlB4V6OhkA+e4dhCSwc+dM3U
r4v4cL0/Ftx1OJPZoW69AbTKs33TAgMBAAGjIzAhMA8GA1UdEwEB/wQFMAMBAf8w
DgYDVR0PAQH/BAQDAgIEMA0GCSqGSIb3DQEBCwUAA4IBAQCiM/qAEy7zV4GG5ETY
6x5NjpV+NFNHpFJTo0Wz5xEzRv5dK9CmFPS6XIdKpgRph665EtOtdbDGLji/zOIt
CLDI5zfXpx/11+raWvNPe1NJ/u1uezDPiIE5xHCh8uOn3E6SMkCJgJPHCePrUG7m
V03rsQPT/lIVw8/e7Gu5titvLBxAzfFd4dGEoixjc/mHP9mtyeebnbDxCB47Kijw
3Tlaf9YWwly6bUbr7esGed1FDWu9LSRQRXsINb6YxLBK99NQE2LA0ITg7nc/qFBJ
XLbnRUiThBCl6AWXt6HOS2CSC14apmC+DCTMhmM0B9u2sYidKrxAb0009WnnHtFq
qp+b
-----END CERTIFICATE-----
`
        ]
    }
});

/**
 * Automatically includes token.
 *
 * @param path of the API call.
 * @param data to be given to the API.
 */
export async function Post(path: string, data?: any) {
    try {
        return axiosInstance.post(`${config.server}/${config.apiParent}/${path}`, data, {
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
        return await axiosInstance.delete(`${config.server}/${config.apiParent}/${path}`,{
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
        return axiosInstance.get(`${config.server}/${config.apiParent}/${path}`, {
            headers: {
                Authorization: LocalStorage.getUser()?.token
            },
        });
    } catch (e) {
        return e;
    }
}

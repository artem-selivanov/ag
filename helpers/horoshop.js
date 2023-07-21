const axios = require('axios');

class horoshopClass {

    constructor({login, pass, domain}) {
        this.login = login;
        this.pass = pass;
        this.domain = domain;
    }

    async init() {
        let data = {
            'login': this.login,
            'password': this.pass,
        };

        let options = {
            'method': 'post',
            'url': `https://${this.domain}/api/auth/`,
            'headers': {
                'Content-Type': 'application/json',
            },
            'data': JSON.stringify(data),
        };

        await axios(options)
            .then(response => {
                let getdata = response.data;
//                console.log(getdata);
//                console.log(getdata.response.token);
                this.token = getdata.response.token;
                console.log(this.token)
            })
            .catch(error => {
                console.error(error);
            });
    }

    async getItems(start) {
        const data = {
            "offset": start,
            includedParams: ["quantity", "price", "name", "presence","brand"],
            "token": this.token
        };

        const options = {
            method: 'POST',
            'url': `https://${this.domain}/api/catalog/export/`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(data),
        };

        //console.log(options)

        return await axios(options)
            .then(response => {
                    return response.data.response.products
                }
            )
            .catch(error => {
                console.error('Error:', error);
                return null;
            });
    }


    async updateData(article, price, presence) {
        const data = {
            "products": [
                {"article": article, "price": price, "presence": presence}
            ],
            "token": this.token
        };

        const options = {
            method: 'POST',
            url: `https://${this.domain}/api/catalog/import/`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(data),
        };

        return await axios(options)
            .then(response => {
                console.log(response);
                return response
            })
            .then(getdata => {
                console.log(getdata);
                return getdata;
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    async sendUpdate(url,products) {
        const data = {
            products,
            "token": this.token
        };

        const options = {
            method: 'POST',
            url: `https://${this.domain}${url}`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(data),
        };

        return await axios(options)
            .then(response => {
                //console.log(response.data);
                return response.data
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }


}

module.exports = horoshopClass
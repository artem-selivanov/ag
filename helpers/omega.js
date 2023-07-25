const unzipper = require('unzipper');
const {omega, bd} = require('../settings');
const axios = require('axios');
const fs = require('fs');
const iconv = require('iconv-lite');
const readline = require('readline');

class omegaClass {
    constructor(key) {
        this.key = key;
    }

    async download(Id, filePath) {
        const response = await axios.post(`https://public.omega.page/public/api/v1.0/price/downloadPrice`, {
            Id,
            Key: this.key
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/zip'
            }, responseType: 'stream'
        })
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        console.log('File downloaded successfully!');
        return filePath
    }

    async enqueue(Id) {
        return await axios.post(`https://public.omega.page/public/api/v1.0/price/enqueuePrice`, {
            Id,
            Key: this.key
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => {
                console.log(response.data)
                return response.data
            })
            .catch(error => {
                console.error(error);
            });
    }

    async priceStatuses(id) {
        return await axios.post(`https://public.omega.page/public/api/v1.0/price/getPrices`, {
            Key: this.key
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => {
                //console.log(response.data)
                //console.log(response.data.Data.find(i=>i.Id===id))
                const result = response.data.Data.find(i => i.Id === id)
                return result == null ? null : result.Status

            })
            .catch(error => {
                console.error(error);
            });
    }

    async getImage(ProductId, file_name) {
        try {
            const response = await axios.post(
                `https://public.omega.page/public/api/v1.0/product/image`,
                {
                    ProductId,
                    Number: 1,
                    Key: this.key,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    responseType: 'stream',
                }
            );

            // Ensure that the response status is 200 (OK) before proceeding
            if (response.status !== 200) {
                throw new Error('Failed to fetch image. Status: ' + response.status);
            }

            const writer = fs.createWriteStream(file_name);

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log('File downloaded successfully!');
        } catch (error) {
            console.error('Error while fetching and saving image:', error);
        }
    }

    async waitInSeconds(seconds) {
        if (this.logging) console.log(`The script will wait ${seconds} seconds`)
        return new Promise((resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    }

    async unzip(file) {
        await unzipper.Open.file(file)
            .then((archive) => {
                archive.extract({path: process.cwd()}); //path: destinationFolder
            })
            .catch((error) => {
                console.error('Error extracting the zip file:', error);
            });
    }

    async processCSV(csvFilePath, cats, items, price) {
//    const csvFilePath = 'CsvPriceGoodsNewApi.csv';
        const result = []
        const prices = []
        const presense = []
        const skus= []
        const stream = fs.createReadStream(csvFilePath).pipe(iconv.decodeStream('cp1251'));

        //console.log('here1')
        const rl = readline.createInterface({
            input: stream,
            crlfDelay: Infinity // to handle different line endings
        });
        let lines = []
        //console.log('here2')
        for await (const line of rl) {
            lines.push(line)
            //console.log(line);
        }
        console.log(`Позицій в CSV файл: ${lines.length}`)
        const caption = lines.shift().split("|")
        for (let row of lines) {
            const fields = row.split("|")
            let obj = {}
            fields.map((v, i) => (obj[caption[i]] = v))
            skus.push(obj.KART);
            obj.price = parseInt((100 + price) * parseFloat(obj.CENAPART) / 100)

            if (items[obj.KART]) {
                if (items[obj.KART].quantity != obj.STOCK) presense.push(obj)
                if (items[obj.KART].price != obj.price) prices.push(obj)
                continue
            }

            if (cats[obj.KART] == null) continue
            obj.cat=cats[obj.KART]
            //obj.cat = cats[obj.KART]
            result.push(obj)
        }

        const test=(Object.values(items)).filter(i=>i.cat!="Акции"&&parseInt(i.quantity)!=0&&skus.indexOf(i.sku)==-1).map(i=>presense.push({KART:i.sku, STOCK:0}))
        console.log(`На виключення ${test.length}`)
        //console.log({result, update})
        return {add: result, price:prices, availability:presense}
        //console.log('CSV file processing complete.');
    }

    async brands(PageIndex) {
        return await axios.post(`https://public.omega.page/public/api/v1.0/product/getBrands`, {
            Key: this.key, PageSize: 100, PageIndex
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => {
                //console.log(response.data.Data)
                //console.log(response.data.Data.find(i=>i.Id===id))
                return response.data.Data

            })
            .catch(error => {
                console.error(error);
            });
    }

    async processPrice(price_id, file_name) {
        let status = await this.priceStatuses(price_id)
        if (status == "Error") return
        if (status == "Default") await this.enqueue(price_id)
        status = await this.priceStatuses(price_id)
        const max = 600;
        let i = 0;
        while (status != "ReadyForDownload") {
            console.log(`wait 10 sec`)
            await this.waitInSeconds(10)
            i += 10
            if (i > max) {
                console.log(`Timeout for waiting`)
                return
            }
            status = await this.priceStatuses(price_id)
            if (status == null) return
        }
        await this.download(price_id, file_name)
        await this.unzip(file_name)
        await this.waitInSeconds(20)
        await this.deleteFile(file_name);
    }

    async deleteFile(path) {
        await fs.unlink(path, (err) => {
            if (err) throw err;
            console.log('File was successfully deleted');
        });
    }

    processXls(data, cats) {
        let obj = {}
        let name = null
        for (let row of data) {

            if (row[1] == "") {
                if (row[3] != '' && row[3].indexOf(".") == -1) name = row[3]
                //console.log(name)
                continue
            }
            if (name == null || cats[name] == null) continue
            obj[row[1]] = cats[name]
        }
        return obj
    }
}

module.exports = omegaClass
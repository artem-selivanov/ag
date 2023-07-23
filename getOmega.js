const mysqlHandler = require('./helpers/bd');
const {omega, bd} = require('./settings');
const fs = require('fs');
const iconv = require('iconv-lite');
const readline = require('readline');
const omegaClass = require('./helpers/omega');
const SheetHandler = require('./helpers/spreadsheet');
const xlsx = require('node-xlsx');
const test = false;

const sheet_id = "1AnBG1h6JT8BloHNvtYiJsdCQnXuc0J6ti7yVm1hpH2Y"

const s = new SheetHandler(sheet_id)
const o = new omegaClass(omega)
const m = new mysqlHandler(bd);
const price_id = 16;
const price_id2 = 31;
const file_name = 'output.zip';
const file_csv = 'CsvPriceGoodsNewApi.csv';
const file_xls = 'ExcelPriceCISAvailabilityApi.xls';

(async function () {
    let cats = await s.getCats()
    const markup = await s.getMarkup()
    const horo_items = (await m.getArr(`SELECT *
                                        FROM \`horoshop\``)).reduce(
        (map, obj) => {
            map[obj.sku] = obj;
            return map;
        },
        {}
    )
    if (!test) {
        await o.processPrice(price_id, file_name)
        await o.processPrice(price_id2, file_name)
    }
    const workbook = xlsx.parse(file_xls);
    const cats2 = o.processXls(workbook.find(i => i.name == "ПрайсЛист").data, cats)
    const {add, price, availability} = await o.processCSV(file_csv, cats2, horo_items, markup)

    const will_send = []
    const presence = []
    const images = []

    for (let item of add) {
        //console.log(item.ProductId)
        const product = {
            parent: `Интернет магазин /${item.cat}`,
            //           parent_article: item.KODKAT,
            article: item.KART,
            article_for_display: item.KODKAT,
            title: {ru: item.NAIM, ua: item.NAIMUKR},
            brand: item.PROIZVODIT,
            price: item.price,
            display_in_showcase: 1
//            presence: item.STOCK == 1 ? "в наличии" : "нет в наличии"

        }
        const product2 = {"article": item.KART, "warehouse": "office", "quantity": 1}
        presence.push(product2)
        will_send.push(product);
        images.push({sku:item.KART, productid:item.ProductId})
    }

    for (let item of price) {
        const product = {
            article: item.KART,
            price: item.price,
        }
        will_send.push(product);
    }

    for (let item of availability) {
        const product2 = {"article": item.KART, "warehouse": "office", "quantity": item.STOCK}
        presence.push(product2)
    }
    if (will_send.length > 0)
        await m.insertRows(`INSERT INTO queue (sku, \`type\`, horoshop)
                            VALUES ?`, will_send.map(item => [item.article, "item", JSON.stringify(item)]))
    if (presence.length > 0)
        await m.insertRows(`INSERT INTO queue (sku, \`type\`, horoshop)
                            VALUES ?`, presence.map(item => [item.article, "presence", JSON.stringify(item)]))

    if (images.length > 0)
        await m.insertRows(`INSERT INTO images (sku, productid)
                            VALUES ?`, images.map(item => [item.sku, item.productid]))


    if (test) console.log(add[0])
    //console.log(availability)
    console.log(`Добавление товаров ${add.length}, обновление цены ${price.length}, изменение наличия ${availability.length}`)
    console.log(`Товаров на добавление картинок: ${images.length}`)

    if (!test) {
        await o.deleteFile(file_csv)
        await o.deleteFile(file_xls)
    }
})()











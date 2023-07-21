const mysqlHandler = require('./helpers/bd');
const {omega, bd} = require('./settings');
const fs = require('fs');
const iconv = require('iconv-lite');
const readline = require('readline');
const omegaClass = require('./helpers/omega');
const SheetHandler = require('./helpers/spreadsheet')
const sheet_url = "16UVkkvDhvFwLnKPLApEZc1h9rds5AYCslBeGM4kaj5A"

const o = new omegaClass(omega)
const m = new mysqlHandler(bd);
const s = new SheetHandler();


(async function () {
    let brands
    let results = []
    let i = 0
    do {
        brands = (await o.brands(i)).map(i => [i.Value])
        results = [...results, ...brands]
        console.log(results.length)
        await o.waitInSeconds(3)
        i++
    } while (brands.length == 100)
    //console.log(brands)
    s.setValues(results, sheet_url, "Sheet1", "A2")
    //s.setValues()
})()


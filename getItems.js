const horoshopClass = require('./helpers/horoshop');
const mysqlHandler = require('./helpers/bd');
const {settings, bd} = require('./settings');
const h = new horoshopClass(settings);
const m = new mysqlHandler(bd);


(async function () {
    await m.executeRow(`TRUNCATE TABLE horoshop`)
/*    const items = await m.getSet(`SELECT *
                                  FROM \`horoshop\``, "sku")
*/    await h.init()
    let result
    let start = 0
    while (true) {
        result = await h.getItems(start)
        if (result == null) break;
        if (result.length > 0)
            await m.insertRows(`INSERT INTO horoshop (sku, brand,  cat, availability, quantity, price)
                                VALUES ?`, result.map(item => [item.article, item.brand.value?.ru||"", item.parent?.value||"", item.presence.id == 2 ? 0 : 1, item.quantity, item.price]))
        start += 500
        console.log(result)
        //console.log(result[0].brand.ru)
//        break;
        if (result.length < 500) break;
    }

    //console.log(test)
})()
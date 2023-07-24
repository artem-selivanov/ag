const mysqlHandler = require('./helpers/bd');
const {omega, bd} = require('./settings');

const omegaClass = require('./helpers/omega');
const test = false;
const o = new omegaClass(omega);
const m = new mysqlHandler(bd);
const local_path=test?"":"/var/www/html/images/";
const url = "https://app.vostokzapchast.com.ua/images/";
const count_files = 10;//20

(async function () {
    const images = await m.getArr(`SELECT *
                                        FROM \`images\` where status="0" limit 0,${count_files}`)
    const result = []
    for (let image of images) {
        //console.log(image.productid)
        await o.getImage(image.productid,`${local_path}${image.sku}.jpg`)
        result.push({"article": image.sku, "images": {
                "override": false,
                "links": [
                    `${url}${image.sku}.jpg`,
                ]
            }})
        //console.log(file)
        //await o.waitInSeconds(10);
    }
    if(images.length>0)
    await m.executeRow(`UPDATE \`images\`
                            SET status="1"
                            WHERE id in (${images.map(i=>i.id).join(", ")})`)

    if (result.length > 0)
        await m.insertRows(`INSERT INTO queue (sku, \`type\`, horoshop)
                            VALUES ?`, result.map(item => [item.article, "item", JSON.stringify(item)]))
})()











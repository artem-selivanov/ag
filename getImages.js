const mysqlHandler = require('./helpers/bd');
const {omega, bd} = require('./settings');

const omegaClass = require('./helpers/omega');
const test = false;
const o = new omegaClass(omega);
const m = new mysqlHandler(bd);
const local_path=test?"":"/var/www/html/images/";
const url = "https://app.vostokzapchast.com.ua/images/";
const count_files = 20;//20

(async function () {
    const images = await m.getArr(`SELECT *
                                        FROM \`images\` where status="0" limit 0,${count_files}`)
    if (images.length==0) return
    const result = []
    const item_ids=[]
    for (let image of images) {
        //console.log(image.productid)

        console.log(`Work with ${image.sku}`)
        const status = await o.getImage(image.productid,`${local_path}${image.sku}.jpg`)
        if (!status) {
            await m.executeRow(`UPDATE \`images\`
                            SET status="2"
                            WHERE id=${image.id}`)
            continue}
        result.push({"article": image.sku, "images": {
                "override": false,
                "links": [
                    `${url}${image.sku}.jpg`,
                ]
            }})
            item_ids.push(image.id)
        //console.log(file)

        await o.waitInSeconds(5);
    }
    await m.executeRow(`UPDATE \`images\`
                            SET status="1"
                            WHERE id in (${item_ids.join(", ")})`)

    if (result.length > 0)
        await m.insertRows(`INSERT INTO queue (sku, \`type\`, horoshop)
                            VALUES ?`, result.map(item => [item.article, "item", JSON.stringify(item)]))
})()











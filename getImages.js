const mysqlHandler = require('./helpers/bd');
const {omega, bd} = require('./settings');

const omegaClass = require('./helpers/omega');
const test = true;
const o = new omegaClass(omega);
const m = new mysqlHandler(bd);
const local_path=test?"":"/home/a_dmin/ag/";

(async function () {
    const images = await m.getArr(`SELECT *
                                        FROM \`images\` limit 0,3`)
    for (let image of images) {
        //console.log(image.productid)
        await o.getImage(image.productid,`${local_path}${image.sku}.jpg`)
        //console.log(file)
        //await o.waitInSeconds(10);
    }
})()











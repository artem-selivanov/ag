const horoshopClass = require('./helpers/horoshop');
const mysqlHandler = require('./helpers/bd');
const {settings, bd} = require('./settings');
const h = new horoshopClass(settings);
const m = new mysqlHandler(bd);

const count = 1000;

(async function () {
    let timeout = await m.getArr(`SELECT *
                                  FROM settings
                                  WHERE name = "timeout"`)
    timeout = timeout.length == 0 ? 0 : parseInt(timeout[0]['prop'])
    if (timeout > Date.now()) {
        console.log(`Waiting for timeout ends...`)
        return
    }

    await h.init()
    const types = ["item", "presence"]
    for (let type of types) {
        const items = await m.getArr(`SELECT *
                                      FROM \`queue\`
                                      WHERE sent = "0"
                                        AND \`type\` = "${type}" limit 0, ${count}`)

        //console.log(items)
        if (items.length == 0) continue
        const items_ids = items.map(i => i.id)
        const query = []
        items.map(i => query.push(JSON.parse(i.horoshop)))
        console.log(query.length)
        const url = type == "item" ? "/api/catalog/import/" : "/api/catalog/importResidues/"
        const response = await h.sendUpdate(url, query)
        if (response.response.message != null) {
            console.log(response.response.message)
            const seconds = parseInt(response.response.message.replace("You hour requests limit has been exceeded. Retry after ", "").replace(" seconds", ""))
            const currentTime = new Date();
            currentTime.setSeconds(currentTime.getSeconds() + seconds + 60);
            await m.executeRow(`UPDATE \`settings\`
                                SET prop="${currentTime.getTime()}"
                                WHERE name = "timeout"`)
            break
        }
        //break
        console.log(response.response)

        if (type == "item")
            response.response.log.map(i => (console.log(i.info)))
        else console.log(response.response.log)
        await m.executeRow(`UPDATE \`queue\`
                            SET sent="1"
                            WHERE id in (${items_ids.join(", ")})`)
    }
    //console.log(test)
})()


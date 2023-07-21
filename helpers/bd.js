const mysql = require('mysql2/promise');

class MysqlHandler {
    constructor(bd) {
        this.conn = null;
        this.bd = bd;
    }

    async initMysql() {

        this.conn = this.conn != null ? this.conn : await mysql.createConnection(this.bd)
    }

    endMysql() {
        this.conn.end();
    }

    async getSet(query, property, disconnect = true) {
        //console.log(this.conn)
        if (this.conn == null) await this.initMysql()
        const [rows] = await this.conn.execute(query)
        let items = rows.reduce(
            (set, obj) => {
                set.add(obj[property]);
                return set;
            },
            new Set()
        );
        if (disconnect) {
            this.endMysql()
            this.conn = null
        }
        return items
    }

    async getMap(query, id, property, disconnect = true) {
        //console.log(this.conn)
        if (this.conn == null) await this.initMysql()
        const [rows] = await this.conn.execute(query)
        let items = rows.reduce(
            (map, obj) => {
                map.set(obj[id], obj[property]);
                return map;
            },
            new Map()
        );
        if (disconnect) {
            this.endMysql()
            this.conn = null
        }
        return items
    }

    async getArr(query, disconnect = true) {
        //console.log(this.conn)
        if (this.conn == null) await this.initMysql()
        const [rows] = await this.conn.execute(query)
        if (disconnect) {
            this.endMysql()
            this.conn = null
        }
        return rows
    }

    async insertRows(query, data, disconnect = true) {

        if (data.length == 0) return;
        if (this.conn == null) await this.initMysql();

        const [res, fields] = await this.conn.query(query, [data], function (err, results, fields){})
        console.log(res.insertId)


        if (disconnect) {
            this.endMysql();
            this.conn = null;
        }
        return res.insertId;
    }

    async executeRow(query, disconnect = true) {
        if (this.conn == null) await this.initMysql()
        const result = await this.conn.execute(query)
        if (disconnect) {
            this.endMysql()
            this.conn = null
        }
        return result[0].insertId
    }
    escapeStr(str) {
        return this.conn.escape(str);
    }
}

module.exports = MysqlHandler
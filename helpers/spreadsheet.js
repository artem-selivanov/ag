const {google}= require('googleapis')
const keys= require('./agrd.json')

class SheetHandler {
    constructor(sheet_id) {
        this.api = null;
        this.keys = keys;
        this.sheet_id = sheet_id
    }

    async initSheet() {
        if (this.api != null) return
        const sheet_cl = new google.auth.GoogleAuth({
            credentials: {
                private_key: this.keys.private_key,
                client_email: this.keys.client_email,
            },
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
            ],
        });
        const authClientObject = await sheet_cl.getClient();
        this.api = google.sheets({
            version: 'v4',
            auth: authClientObject,
        })
    }

    async setValues(arr,sheet,list,range){
        if (this.api == null) await this.initSheet()
        const updateOptions = {
            spreadsheetId: sheet,
            range: `${list}!${range}`,
            valueInputOption: 'USER_ENTERED',
            resource: {values: arr}
        }
        const responce=await this.api.spreadsheets.values.update(updateOptions)
        return responce
    }

    async getValues(sheet,list){
        if (this.api == null) await this.initSheet()
        const updateOptions = {
            spreadsheetId: sheet,//"1UBiMG5nOLkZNjW5SNis_snrDhpiThG4TGqRCMn_mX90",
            range: `${list}`,
        }
        const responce=await this.api.spreadsheets.values.get(updateOptions)
        return responce.data.values
    }

    async getSheetId(sheet,name){
        if (this.api == null) await this.initSheet()
        const Options = {
            spreadsheetId: sheet,//"1UBiMG5nOLkZNjW5SNis_snrDhpiThG4TGqRCMn_mX90",
            includeGridData: false,
            ranges: [`${name}`]
        }
        const responce=await this.api.spreadsheets.get(Options)
        return responce.data.sheets[0].properties.sheetId
    }

    async clearContent (sheet,list,range){
        if (this.api == null) await this.initSheet()
        let tmp=await this.getValues(sheet,list)
        const maxrow=tmp.length
        const sheetId = await this.getSheetId(sheet,list)
        var batchUpdateRequest = {
            "requests": [
                {
                    "deleteDimension": {
                        "range": {
                            "sheetId": sheetId,
                            "dimension": "ROWS",
                            "startIndex": range,
                            "endIndex": maxrow
                        }
                    }
                }
            ]
        }

        const response=this.api.spreadsheets.batchUpdate({
            spreadsheetId: sheet,
            resource: batchUpdateRequest
        })
    }

    async renameSheet (sheet,name){
        if (this.api == null) await this.initSheet()
        var batchUpdateRequest = {
            "requests": [
                {
                    "updateSpreadsheetProperties": {
                        "properties": {
                            "title": name,
                        },
                        "fields": "title",
                    }
                }
            ]
        }
        const response=this.api.spreadsheets.batchUpdate({
            spreadsheetId: sheet,
            resource: batchUpdateRequest
        })

    }

    async getSheetName(sheet){
        if (this.api == null) await this.initSheet()
        const Options = {
            spreadsheetId: sheet,//"1UBiMG5nOLkZNjW5SNis_snrDhpiThG4TGqRCMn_mX90",
            includeGridData: false
        }
        const responce=await this.api.spreadsheets.get(Options)
        return responce.data.properties.title
    }

    async getCats(){
        const arr = await this.getValues(this.sheet_id,"Выбор")
        arr.shift()
        let obj = {}
        arr.filter(i=>i.length!=1&&i[1]!="").map(i=>(obj[i[0]]=prepare(i[1]))) //||i[1]!=""
        return obj
    }

    async getMarkup(){
        const arr = await this.getValues(this.sheet_id,"Наценка")
        //console.log(arr)
        return parseInt(arr[0][1])
    }

    async getMarkup(){
        const arr = await this.getValues(this.sheet_id,"Наценка")
        //console.log(arr)
        return parseInt(arr[0][1])
    }
    async getCatsPrices(){
        let obj = {}
        const arr = await this.getValues(this.sheet_id,"Наценка по категории")
        arr.shift()
        arr.filter(row=>row[1]!=""&&row[1]!==undefined).map(i=>obj[i[0]]=parseFloat(i[1]))
        return obj
    }

}

function prepare (str){
    //console.log(str)
    if (str.toString().endsWith(' /')) {
        // Remove the trailing slash and replace it with the modified string
        return str.slice(0, -2);
    }
    return str
}


module.exports = SheetHandler
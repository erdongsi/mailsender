// 按行读取配置文件
// 区分注视

const fs = require("fs");
const readline = require("readline");

const helper = require("./helper");

class config {

    static getInst() {
        if (helper.isNullOrUndefined(config.inst)) {
            config.inst = new config();
        }
        return config.inst;
    }

    constructor() {
        this._cfg = null;
    }

    load(file_path, callback) {
        helper.log("[config:load] (",file_path+",", "callback) >>>>>");

        let e = null;

        if (false == fs.existsSync(file_path)) {
            e = new Error("The file is not exist:", file_path);
            callback(e, null);
        } else {
            let rs = fs.createReadStream(file_path);
            if (helper.isNullOrUndefined(rs)) {
                e = new Error("Create read stream failed:", file_path);
                callback(e, null);
            } else {
                const rl = readline.createInterface({
                    input: rs,
                    crlfDelay: Infinity
                });

                let e = null;

                rl.on('line', (ln)=>{
                    if (0==ln.indexOf("//") || 0==ln.indexOf("#")) {
                        // comments
                    } else if (0 == ln.indexOf("/*")) {
                        e = new Error("Comments does not support /*, please use '//' or '#'.")
                    } else {
                        let ss = ln.split('=');
                        if (ss.length >= 2) {
                            if (helper.isNullOrUndefined(this._cfg)) {
                                this._cfg = {};
                            }
                            let k = ss[0].replace(/ /g, "");
                            let v = ss[1];// ss[1].replace(/ /g, "");
                            this._cfg[k] = v;
                        }
                    }
                });
                rl.on('close', ()=>{
                    //helper.log("[config:load] config:", this._cfg);
                    callback(e, this._cfg);
                });
            }
        }
    }
    getConfig() {
        return this._cfg;
    }
}

module.exports = config;


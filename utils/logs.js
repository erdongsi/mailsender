const fs = require("fs");
const path = require("path");

const helper = require('./helper');

class logs {

    static getInst() {
        if (helper.isNullOrUndefined(logs.inst)) {
            logs.inst = new logs();
        }
        return logs.inst;
    }

    constructor() {
        this._name = "logs";
        this._lst = [];
        this._logger = null;
        this._logging = false;
        this._MAX_LOG = 1000*1000;    // if one log is about 128 bytes, 1000*128 = 128K, 128k*100 = 12.8M.
        this._log_num = 0;
        this._history_logs = [];
        this._ids = "";
        this._clean_log_num = 36;
    }
    setID(ids, cln) {
        if (false == helper.isNullOrUndefined(ids)) {
            if (this._ids != ids) {
                this._ids = ids;
                this._logger = null;
            }
        }
        if (false == helper.isNullOrUndefined(cln)) {
            this._clean_log_num = cln;
        }
    }
    log(ary) {
        this._lst.push(ary);

        setImmediate(()=>{ this.doLogs(); });
    }
    doLogs() {
        //console.log("[logs:doLogs] () >>>>>", this._logging, this._lst.length);
        if (this._logging) {
            return;
        }
        this._logging = true;

        if (helper.isNullOrUndefined(this._logger)) {
            this.createLogger((e_chk)=>{
                if (e_chk) { helper.logRed("[logs:doLogs] e_chk:", e_chk.message); }

                this._logging = false;

                //console.log("[logs:doLogs] () ------- 0:", this._logging, this._lst.length);
            });
        } else {
            while(this._lst.length > 0) {
                let ary = this._lst.shift();
                let s = "";
                ary.forEach((f)=>{
                    try {
                        s += (f + " ");
                    } catch (e) {
                        s += ("[object.no.string]" + " ");
                    }
                });
                this._logger.log(s);

                //this._logger.log(ary);

                this._log_num += 1;
                
                //helper.log("log_cnt:", log_cnt, ", lst", lst.length);
                if (this._log_num >= this._MAX_LOG) {
                    this._logger = null;
                    break;
                }
            }
            this._logging = false;
            //console.log("[logs:doLogs] _log_num:", this._log_num);
            //console.log("[logs:doLogs] () -------- 1:", this._logging, this._lst.length);
        }
    }
    createLogger(callback) {
        //helper.log("[logs:createLogger] (callback) >>>>>");
        let folder = path.resolve(__dirname,'../../logs/');
        if (false == fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        if (false == fs.existsSync(folder)) {
            callback(new Error("Log folder not exist:", folder));
        } else {
            let log_file = folder + "/" + "log_" + this._ids +"_" + helper.getTimeString();
            helper.logYellow("[logs:createLogger] new log_file:", log_file);

            this._history_logs.push(log_file);
            setTimeout(()=>{ this.cleanHistory(); }, 1000);

            let output = fs.createWriteStream(log_file);

            this._logger = new console.Console(output);
            this._log_num = 0;

            callback(null);
        }
    }
    cleanHistory() {
        let more = this._history_logs.length - this._clean_log_num;
        if (more > 0 && more < this._history_logs.length-1) {
            for (let i = 0; i < more; i++) {
                let f = this._history_logs.shift();
                if (false == helper.isNullOrUndefined(f)) {
                    fs.unlink(f, (e_unl)=>{
                        if (e_unl) {
                            helper.logRed("["+this._name+":cleanHistory] e_unl:", e_unl.message);
                        } else {
                            helper.log("["+this._name+":cleanHistory] remove:", f);
                        }
                    });
                }
            }
        }
    }
}

module.exports = logs;
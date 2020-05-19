
const fs = require("fs");

const helper = require("./utils/helper");

function doCmd(args) {
    let _ret = [];
    try {
        switch(args[0]){
            default:
                _ret = args;
                break;
        }
    } catch(e) {
        helper.logRed("[mycmder:doCmd] event(line) e:", e.message);
    }
    return _ret;
}

exports.doCmd = doCmd;
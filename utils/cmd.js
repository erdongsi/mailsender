// 给 nodejs工程 增加 cmd支持， 可以通过 self_cmder 作自定义处理

const readline = require("readline");
const os = require("os");

const helper = require("./helper");

// self_cmder: customed cmd processer. if is null, using self cmd processer. 
function start(self_cmder) {
    helper.log("[cmd:start] (", (helper.isNullOrUndefined(self_cmder)?"null":"self_cmder"),") >>>>>");

    let r = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    r.on("line", (lin)=>{
        //helper.log("[cmd:start] event(line):", lin);

        let args = [];
        let quates = lin.trim().split('"');
        for (let i = 0; i < quates.length; i++) {
            if (0 == i%2) {
                let qs = quates[i].split(' ');
                qs.forEach(function(q) {
                    if (q.length > 0) {
                        args.push(q);
                    }
                });
            } else {
                args.push(quates[i]);
            }
        }
        args.forEach((ag,i)=>{
            //helper.log("[cmd:start]",i,ag);
        });

        if (false == helper.isNullOrUndefined(self_cmder)) {
            args = self_cmder(args);
        }

        if (args.length > 0) {
            cmder(args);
        }
    });

    r.on("close", ()=>{
        helper.log("[cmd:start] event(close)");
        if ('win32' == os.platform()) {
            process.exit();
        }
    });

}
function cmder(args) {
    helper.log("[cmd:cmder] (",args,") >>>>>");
    try {
        switch(args[0].trim()){
            case "exit":
                process.exit(0);
                break;
            default:
                break;
        }
    } catch(e) {
        helper.log("[cmd:cmder] event(line) e:", e.message);
    }
}

exports.start = start;
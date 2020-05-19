const path = require("path");

const helper = require("./utils/helper");
const cmd = require("./utils/cmd");
const logs = require("./utils/logs");

const mailsender = require("./src/mailsender");

const mycmd = require("./mycmd");

const MOD_NAME = "example_mailsender";

logs.getInst().setID(MOD_NAME,2);

// 0.make mycmd
cmd.start(mycmd.doCmd);

let mod = new mailsender();
let cfg = {user:'abcd@163.com', pass:'abcdpassword', server:'smtp.163.com', from_name:'ABCD', from_addr:'abcd@163.com'
    , to_emails:[{name:'wang',addr:'wang@163.com'},{name:'chen',addr:'chen@163.com'}]
    , subject:'mail title', body:'mail body', attachs:['c:\\file1.ext','c:\\file2.png','c:\\file3.xlsx']};

mod.send(cfg, (e)=>{
    if (e) {
        helper.logRed("["+MOD_NAME+"] e:", e.message);
    } else {
        helper.log("["+MOD_NAME+"] done.");
    }
});
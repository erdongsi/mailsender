# mailsender
 A simple mail sender support smtp.

# How to code?
Key codes of example_mailsender.js:

    const mailsender = require("./src/mailsender");

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


# How to run it?
Install node.js first.

windows>node example_mailsender.js

linux>nohup node example_mailsender.js </dev/null >/dev/null 2>err.error &



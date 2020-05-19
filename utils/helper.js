const crypto = require("crypto");
const util = require("util");
const http = require("http");
const readline = require("readline");
const child_process = require('child_process');
const fs = require("fs");
const zlib = require("zlib");

const logs = require("./logs");

const HEAD_SIZE = 16;

// 转换 datetime 格式为 (本地时间) 字符串
function getTimeString(dt, dot, noms) {
    if (isNullOrUndefined(dt)) {
        dt = new Date();
    }
    if (isNullOrUndefined(dot)) {
        dot = ".";
    }
    let time = dt.getFullYear()+fillZero(2,dt.getMonth()+1)+fillZero(2,dt.getDate())+dot+fillZero(2,dt.getHours())+fillZero(2,dt.getMinutes())+fillZero(2,dt.getSeconds());
    if (true == noms) {
    } else {
        time = time + dot + fillZero(3,dt.getMilliseconds());
    }
    return time;
}
// 获得本机 ip4
function getLocalIpv4Address() {
    let _ret = "";
    let interfaces = require('os').networkInterfaces();  
    for(let devName in interfaces) {  
          let iface = interfaces[devName];  
          for (let i=0; i<iface.length; i++){  
               let alias = iface[i];  
               if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){  
                    //console.log("address:", alias.address);
                     _ret = alias.address;  
               }  
          }  
    }  
    return _ret;
}
// 以 fillchar 来 补齐数字，并转为 字符串
function fillZero(num, value, fillchar){
    let ret = value.toString();  
    let len = ret.length;  
    let cha = "0";
    if (false == isNullOrUndefined(fillchar)) {
        cha = fillchar.toString();
    }
    while(len < num) {
    	ret = cha + ret; 
    	len++; 
    }  
    return ret;  
}
const ANSI_VT100_COLOR = {
    'bold'      : '\x1B[1m',
    'dim'       : '\x1B[2m',  
    'underlined'    : '\x1B[4m',
    'blink'     : '\x1B[5m',    // 闪烁
    'inverted'  : '\x1B[7m',
    'hidden'    : '\x1B[8m',

    'ret all'   : '\x1B[0m',  // 重置
    'normal'    : '\x1B[21m',
    'normal22'  : '\x1B[22m',
    'normal24'  : '\x1B[24m',
    'normal25'  : '\x1B[25m',
    'normal27'  : '\x1B[27m',
    'normal28'  : '\x1B[28m',

    'default'   : '\x1B[39m',
    'black'     : '\x1B[30m',
    'red'       : '\x1B[31m',
    'green'     : '\x1B[32m',
    'yellow'    : '\x1B[33m',
    'blue'      : '\x1B[34m',
    'magenta'   : '\x1B[35m',
    'cyan'      : '\x1B[36m',
    'lightgray' : '\x1B[37m',
    'darkgray'  : '\x1B[90m',
    'lightred'  : '\x1B[91m',
    'lightgreen'    : '\x1B[92m',
    'lightyellow'   : '\x1B[93m',
    'lightblue' : '\x1B[94m',
    'lightmagenta'  : '\x1B[95m',
    'lightcyan' : '\x1B[96m',
    'white'     : '\x1B[97m',

    'bgdefault'   : '\x1B[49m',
    'bgblack'     : '\x1B[40m',
    'bgred'       : '\x1B[41m',
    'bggreen'     : '\x1B[42m',
    'bgyellow'    : '\x1B[43m',
    'bgblue'      : '\x1B[44m',
    'bgmagenta'   : '\x1B[45m',
    'bgcyan'      : '\x1B[46m',
    'bglightgray' : '\x1B[47m',
    'bgdarkgray'  : '\x1B[100m',
    'bglightred'  : '\x1B[101m',
    'bglightgreen'    : '\x1B[102m',
    'bglightyellow'   : '\x1B[103m',
    'bglightblue' : '\x1B[104m',
    'bglightmagenta'  : '\x1B[105m',
    'bglightcyan' : '\x1B[106m',
    'bgwhite'     : '\x1B[107m',
}
function logConsole() {
    let sfmt = util.format.apply(null, arguments);
    console.log(ANSI_VT100_COLOR['white'], sfmt, ANSI_VT100_COLOR['white']);

    logs.getInst().log([sfmt]);
}
function logConsoleGreen() {
    let sfmt = util.format.apply(null, arguments);
    console.log(ANSI_VT100_COLOR['lightgreen'], sfmt, ANSI_VT100_COLOR['white']);

    logs.getInst().log([sfmt]);
}
function logConsoleRed() {
    let sfmt = util.format.apply(null, arguments);
    console.log(ANSI_VT100_COLOR['lightred'], sfmt, ANSI_VT100_COLOR['white']);

    logs.getInst().log([sfmt]);
}
function logConsoleYellow() {
    let sfmt = util.format.apply(null, arguments);
    console.log(ANSI_VT100_COLOR['lightyellow'], sfmt, ANSI_VT100_COLOR['white']);

    logs.getInst().log([sfmt]);
}
function logLine() {
    let stdout = process.stdout;
    readline.clearLine(stdout, 0);
    readline.cursorTo(stdout, 0);
    let op = "";
    for (let i = 0; i < arguments.length; i++) {
        op += (arguments[i]);
    }
    stdout.write(op);
}
function log() {
    let sfmt = util.format.apply(null,arguments);
    let t = getTimeString();
    console.log(ANSI_VT100_COLOR['white'], t, ANSI_VT100_COLOR['white'], sfmt);

    logs.getInst().log([t, sfmt]);
}
function logGreen() {
    let sfmt = util.format.apply(null,arguments);
    let t = getTimeString();
    console.log(ANSI_VT100_COLOR['white'], t, ANSI_VT100_COLOR['lightgreen'], sfmt, ANSI_VT100_COLOR['white']);

    logs.getInst().log([t, sfmt]);
}
function logRed() {
    let sfmt = util.format.apply(null,arguments);
    let t = getTimeString();
    console.log(ANSI_VT100_COLOR['white'], t, ANSI_VT100_COLOR['lightred'], sfmt, ANSI_VT100_COLOR['white']);

    logs.getInst().log([t, sfmt]);
}
function logYellow() {
    let sfmt = util.format.apply(null,arguments);
    let t = getTimeString();
    console.log(ANSI_VT100_COLOR['white'], t, ANSI_VT100_COLOR['lightyellow'], sfmt, ANSI_VT100_COLOR['white']);

    logs.getInst().log([t, sfmt]);
}
// 从content中截取 begin 和 end 之间的 内容
function getPartString(content, begin, end, include_begin, include_end) {

    let v_ret = "";

    if (false == isNullOrUndefined(content) && false == isNullOrUndefined(begin)) {
        let v_begin_index = content.indexOf(begin);
        if (v_begin_index >= 0) {   // 先获得 包含 begin 的 string

            let v_begin_string = content.substring(v_begin_index);
            

            if (isNullOrUndefined(end)) {  // end 有 参数
                
                if (true === include_begin) {
                    v_ret = v_begin_string;
                } else {
                    v_ret = v_begin_string.substring(begin.length);
                }

            } else {    // end 无 参数

                let v_end_index = v_begin_string.indexOf(end, begin.length);

                if (v_end_index < 0) {  // 没有找到 end，按照 无end参数 的情况处理

                    if (true === include_begin) {
                        v_ret = v_begin_string;
                    } else {
                        v_ret = v_begin_string.substring(begin.length);
                    }

                } else {    // 找到 end

                    // v_temp_string: 是 begin 和 end 之间的字串，不包括 begin，不包括 end
                    let v_temp_string = v_begin_string.substring(begin.length, v_end_index);

                    if (true === include_begin) {

                        if (true === include_end) {
                            v_ret = begin.concat(v_temp_string, end);
                        } else {
                            v_ret = begin.concat(v_temp_string);
                        }

                    } else {

                        if (true === include_end) {
                            v_ret = v_temp_string.concat(end);
                        } else {
                            v_ret = v_temp_string;
                        }
                    }

                }
            }
        }
    }

    return v_ret;
}
// 通过 get 方式获取 http 内容
function getHttp(url, timeout, callback) {
    //log("[helper:getHttp](",url,",callback) >>>>>");

    let is_timeout = false;
    let is_error = false;
    let is_res = false;

    http.get(url, (res)=>{
        //log("[helper:getHttp] web res:", res["headers"]);

        //log("[helper:getHttp] res.statusCode:", res.statusCode);

        if (true == is_timeout) {
            logYellow("[helper:getHttp]",url,"timeout, then cancel data!");
            return;
        }
        if (true == is_error) {
            logYellow("[helper:getHttp]",url,"error, then cancel data!");
            return;   
        }

        is_res = true;

        if (200 != res.statusCode) {
            logRed("[helper:getHttp]",url,":", res.statusCode);
            res.resume();
            callback(null, {code:res.statusCode, data:null});
            return;
        }

        //res.setEncoding("utf8");

        let rawData = Buffer.alloc(0);
        res.on("data", (chunk)=>{
            let tot_len = rawData.length + chunk.length;
            rawData = Buffer.concat([rawData,chunk], tot_len);
        });

        res.on("end", ()=>{
            if (true == is_timeout) {
                logYellow("[helper:getHttp]",url,"timeout, [2]then cancel data!");
                return;
            }
            if (true == is_error) {
                logYellow("[helper:getHttp]",url,"error, [2]then cancel data!");
                return;   
            }
            callback(null, {code:res.statusCode, data:rawData});

        }).on("error", (e)=>{
            logRed("[helper:getHttp] e:", e.message);
            is_error = true;
            callback(e, {code:500, data:null});
        });
    }).on("error", (e)=>{
        logRed("[helper:getHttp] e2:", e.message);
        if (is_res) {
            return;
        }
        if (is_timeout) {
            return;
        }
        is_error = true;
        callback(e, {code:501, data:null});
    }).setTimeout(timeout,()=>{
        logYellow("[helper:getHttp] timeout!");
        if (is_res) {
            return;
        }
        if (is_error) {
            return;
        }
        is_timeout = true;
        callback(new Error("timeout"), {code:500, data:null});
    });
}
// 在 [start,end] 之间 随机 获得一个整数
function randomNum(start,end) {
    let w = Math.max(0, end-start);
    let r = Math.random()*w + start;
    let ret = Math.round(r);
    return ret;
}
// return N个随机字符
const ALPHA = ['0','1','2','3','4','5','6','7','8','9'
    ,'a','b','c','d','e','f','g'
    ,'h','i','j','k','l','m','n'
    ,'o','p','q','r','s','t'
    ,'u','v','w','x','y','z'
    ,'A','B','C','D','E','F','G'
    ,'H','I','J','K','L','M','N'
    ,'O','P','Q','R','S','T'
    ,'U','V','W','X','Y','Z'];
function randomKey(size) {
    let key = "";
    while (key.length < size) {
        let n = randomNum(0, ALPHA.length-1);
        let c = ALPHA[n];
        key += c;
    }
    return key;
}
// 获得 http request 的 ip
function getRequestIp(req) {  
    let ipAddress;  
    let forwardedIpsStr = req.headers['x-forwarded-for'];   
    if (forwardedIpsStr) {  
        let forwardedIps = forwardedIpsStr.split(',');  
        ipAddress = forwardedIps[0];  
    }  
    if (!ipAddress) {  
        ipAddress = req.connection.remoteAddress;  
    }  
    return ipAddress;  
}  
function callApp(param, callback) {
    log("[helper:callApp](", param, ",callback) >>>>>");

    log("process.platform:",process.platform);
    if (process.platform == 'win32') {
        child_process.exec(param, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                //return;
            } else {
                //console.log(`stdout: ${stdout}`);
                //console.log(`stderr: ${stderr}`);
            }
            callback();
        });
    //} else if (process.platform == 'linux') {
    //  cmd = 'xdg-open';
    //} else if (process.platform == 'darwin') {
    //  cmd = 'open';
    } else {
        callback();
    }
}
// 打印内存使用量
function printMem(short) {
    let mem = process.memoryUsage();
    if (isNullOrUndefined(short)) {
        logYellow(JSON.stringify(mem), (mem.heapTotal/(1000*1000)).toFixed(2)+"M");
    } else {
        logYellow((mem.heapTotal/(1000*1000)).toFixed(2)+"M");
    }
}
// 判断 非空
function isNullOrUndefined(obj) {
    if (null == obj || undefined == obj) {
        return true;
    }
    return false;
}
// 不可逆加密，例如 md5加密： data = encrypt('md5', content);
function encrypt(type, content) {
    //log("[helper:encrypt] (",type,",",content,") enter");

    let _encrypt = crypto.createHash(type);//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
    _encrypt.update(content);
    let _data = _encrypt.digest('hex');  //加密后的值d

    //log("[helper:encrypt] return: ", _data);

    return _data;
}
// 可逆加密，例如 cipher(buf, 'rc4', 'a password'); cipher(buf, 'aes192', 'a password');
function cipher(buf, algorithm, key) {
    //log("[helper:cipher] (", "buf[",buf.length,"],", algorithm+",", key,") >>>>>");
    //console.time("cipher");
    let cip = crypto.createCipher(algorithm, key);
    let by_upd = cip.update(Buffer.from(buf));
    //log("by_upd:", by_upd);
    let by_fin = cip.final();
    //log("by_fin:", by_fin);
    //console.timeEnd("cipher");
    return Buffer.concat([by_upd,by_fin], by_upd.length+by_fin.length);
}
// 可逆解密, 例如 decipher(buf, 'rc4', 'a password'); decipher(buf, 'aes192', 'a password');
function decipher(buf, algorithm, key) {
    //log("[helper:decipher] (", "buf[",buf.length,"],", algorithm+",", key,") >>>>>");
    //console.time("decipher");
    let decip = crypto.createDecipher(algorithm, key);
    let by_upd = decip.update(Buffer.from(buf));
    //log("by_upd:", by_upd);
    let by_fin = decip.final();
    //log("by_fin:", by_fin);
    //console.timeEnd("decipher");
    return Buffer.concat([by_upd,by_fin], by_upd.length+by_fin.length); 
}
// buf/string 打包， return buf = head(HEAD_SIZE) + buf;  head = lenSize(4) + key(4) + otherHead;
function enpacket(msg) {
    //log("[helper:enpacket] (", "msg[",msg.length,"]) >>>>>");

    let algorithm = 'rc4';
    let key = randomKey(4);
    //logYellow("[helper:enpacket] key:", key);

    let by_msg = cipher(msg, algorithm, key);
    //by_msg = Buffer.from(by_msg);
    //log("[helper:enpacket] by_msg:", by_msg.length);

    let len = HEAD_SIZE + by_msg.length;
    //log("len:", len);
    let by_len = Buffer.alloc(HEAD_SIZE-4);
    by_len.writeUInt32BE(len, 0);
    //log("by_len:", by_len);
    let by_key = Buffer.from(key);
    //log("by_key:", by_key);
    let by_head = Buffer.concat([by_len,by_key], by_len.length+by_key.length);
    //log("by_head:", by_head);
    let by_send = Buffer.concat([by_head,by_msg], len);
    //log("[helper:enpacket] by_send:", by_send.length);
    //log("[helper:enpacket] by_send:", by_send.toString());

    return by_send;
}
function depacket(recv) {
    //log("[helper:depacket] (","recv[",recv.length+"]) >>>>>");

    let algorithm = 'rc4';    

    if (false == isNullOrUndefined(recv) && recv.length > 0) {
        //log("[helper:depacket] recv:", recv);
        if (recv.length >= HEAD_SIZE) {
            let len = recv.readUInt32BE(0);
            //log("[helper:depacket] len:", len);

            if (recv.length >= len) {
                let by_head = recv.slice(0, HEAD_SIZE);
                let by_key = by_head.slice(-4);
                //log("[helper:depacket] by_key:", by_key);
                let key = by_key.toString();
                //logYellow("[helper:depacket] key:", key);
                
                let by_msg = recv.slice(HEAD_SIZE, len);
                //log("[helper:depacket] msg:", by_msg);

                by_msg = decipher(by_msg, algorithm, key);

                //log("[helper:depacket] msg 2:", by_msg);
                //log("[helper:depacket] msg 3:", by_msg.toString());

                return {buf:by_msg, len};
            } else {
                //logYellow("[helper:depacket] recv < len.");
            }
        } else {
            //logYellow("[helper:depacket] recv < HEAD_SIZE.");
        }
    }
    return {buf:null,len:-1};
}
function gzipFile(filepath, callback) {
    log("[helper:gzipFile] (",filepath+",","callback) >>>>>");

    let inp = fs.createReadStream(filepath);
    let out = fs.createWriteStream(filepath+".gz");
    inp.on('error', (e_inp)=>{
        logRed("[helper:gzipFile] e_inp:", e_inp.message);
        callback(e_inp);
    });
    inp.on('close', ()=>{
        //log("[helper:gzipFile] inp close.");
    });
    inp.on('data', (chunk)=>{
        //log("[helper:gzipFile] inp data:", chunk.length);
    });
    inp.on('end', ()=>{
        log("[helper:gzipFile] inp end.");
    });
    out.on('error', (e_out)=>{
        logRed("[helper:gzipFile] e_out:", e_out.message);
        callback(e_out);
    });
    out.on('drain', ()=>{
        //log("[helper:gzipFile] out drain.");
    });
    out.on('finish', ()=>{
        log("[helper:gzipFile] out finish.");
        callback(null);
    });
    out.on('pipe', ()=>{
        //log("[helper:gzipFile] out pipe.");
    });
    out.on('unpipe', ()=>{
        //log("[helper:gzipFile] out unpipe.");
    });
    inp.pipe(zlib.createGzip()).pipe(out);
}

exports.getTimeString = getTimeString;
exports.getLocalIpv4Address = getLocalIpv4Address;

exports.fillZero = fillZero;

exports.logConsole = logConsole;
exports.logConsoleGreen = logConsoleGreen;
exports.logConsoleRed = logConsoleRed;
exports.logConsoleYellow = logConsoleYellow;
exports.logLine = logLine;

exports.log = log;
exports.logGreen = logGreen;
exports.logRed = logRed;
exports.logYellow = logYellow;

exports.getPartString = getPartString;

exports.getHttp = getHttp;

exports.randomNum = randomNum;
exports.randomKey = randomKey;

exports.getRequestIp = getRequestIp;
exports.callApp = callApp;
exports.printMem = printMem;

exports.isNullOrUndefined = isNullOrUndefined;

exports.encrypt = encrypt;
exports.cipher = cipher;
exports.decipher = decipher;
exports.enpacket = enpacket;
exports.depacket = depacket;

exports.gzipFile = gzipFile;
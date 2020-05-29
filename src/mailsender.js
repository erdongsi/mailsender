// 提供 一种 发送 邮件 的功能。
// 例如 网易邮箱 smtp.163.com:25

const net = require("net");
const fs = require("fs");
const path = require("path");

const helper = require("../utils/helper");
const comm = require("../utils/comm");

const STATE_IDLE = 0;
const STATE_CONNECTING = 1;
const STATE_HELO = 10;
const STATE_AUTH = 20;
const STATE_USER = 30;
const STATE_PASS = 40;
const STATE_FROM = 50;
const STATE_TO = 60;
const STATE_DATA = 70;
const STATE_HEAD = 80
const STATE_BODY = 81;
const STATE_ATTACHHEAD = 90;
const STATE_ATTACHPART = 91;
const STATE_ATTACHDONE = 92;
const STATE_END = 100;
const STATE_QUIT = 200;

const BOUND = "node.cwc.mail";

class mailsender {
    constructor() {
        this._name = 'mailsender';
        this._token = helper.randomNum(0,10000);
        helper.log("["+this._name+"] new:", this._token);
        this._com = null;
        this._state = STATE_IDLE;
    }
    // cfg: {user, pass, server, from_name, from_addr, to_emails, subject, body, attachs, attach_no_base64[option]}
    // to_emails:[{name,addr},{name,addr},...]
    send(cfg, callback) {
        helper.log("["+this._name+":send](",cfg,"callback) >>>>>");

        if (helper.isNullOrUndefined(this.com)) {
            this._com = new comm();
        }
        this._state = STATE_CONNECTING;
        this._com.connect(cfg.server, 25, (boo)=>{
            if (boo) {
                helper.log("["+this._name+":connectcb] boo:", boo);
                //let s_send = "HELO []\r\n";
                //helper.log("["+this._name+":connectcb] send:", s_send);
                //let buf_send = Buffer.from(s_send);
                this._state = STATE_HELO;
                //helper.log(this);
                //helper.log(this._com);
                //this._com.send(buf_send);
                this.sendMsg("HELO []\r\n");
            } else {
                helper.logYellow("["+this._name+":connectcb] boo:", boo, "token:", this._token);
                if (STATE_IDLE != this._state) {
                    callback(new Error("disconnect state: "+this._state));
                }
            }
        }, (dat)=>{
            //helper.log("["+this._name+":recvcb] dat:", dat.length);
            //helper.log("["+this._name+":recvcb] dat:", dat);
            helper.log("["+this._name+":recvcb] dat:", dat.toString().replace( /\r/g, '\\r').replace(/\n/g, '\\n'));

            let s_dat = dat.toString();
            let p_dats = s_dat.split(' ');
            let cod = 0;
            if (p_dats.length > 1) {
                cod = p_dats[0];
                helper.log("["+this._name+":recvcb] cod =", cod);
                //"ERR.LOGIN.USERORPASSNULL":"参数错误:用户名或者密码为空",
                //"ERR.LOGIN.DOMAINNULL":"参数错误:未指定的域邮箱参数",
                //"ERR.LOGIN.PASSERR":"用户名和密码不匹配",
                //"ERR.LOGIN.ILLEGALACCOUNT":"该帐号属于群发名单或者别名，不允许登录",
                //"ERR.LOGIN.USERNOTEXIST":"该帐号不存在，请你确认域名和帐号",
                //"ERR.LOGIN.SUPERADMINDOMAINERR":"该超级管理员并未申请任何域名邮箱",
                //"ERR.LOGIN.SYSTEMBUSY":"登录系统繁忙，请你稍后再试",
                //"ERR.LOGIN.IPDENY":"登录失败，你的IP在黑名单中，请你联系客服",
                //"ERR.LOGIN.USRSTATUS1":"该帐号已被禁用，请联系管理员",
                //"ERR.LOGIN.USRSTATUS2":"帐号已过期，请联系管理员",
                //"ERR.LOGIN.USRSTATUS5":"该帐号已被管理员删除，请联系管理员",
                //"SUC.LOGIN.USRUNLOCK":"该帐号已解除冻结状态，请你再次输入用户和密码继续",
                //"ERR.LOGIN.DOMAINEXPED":"该域名邮箱已经过期了",
                //"ERR.LOGIN.DOMAINNOTREGISTER":"该域名尚未通过，请以超级管理员登录",
                //"ERR.LOGIN.DOMAINSTATUS1":"该域名邮箱已被禁用，请你联系客服",
                //"ERR.SESSIONNULL":"会话已经失效，请你重新登录操作",
                //"ERR.SYSTEM":"系统繁忙，请你稍后再试",
                //"ERR.ADMINREQUIRE":"非法权限，该帐号无法执行这个操作",
                //"ERR.PARAMNULL":"系统发生错误：参数为空",
                //"ERR.ERR.PARAMTOOLONG":"参数过长",
                //"ERR.ILLEGAL":"系统非法操作"。
                if ("220" == cod) {
                    if (s_dat.indexOf('250 OK') >= 10) {
                        if (STATE_HELO == this._state) {
                            this._state = STATE_AUTH;
                            this.sendMsg('AUTH LOGIN\r\n');
                        }
                    }
                } else if ("250" == cod) {
                    if (STATE_HELO == this._state) {
                        
                        this._state = STATE_AUTH;
                        this.sendMsg('AUTH LOGIN\r\n');

                    } else if (STATE_FROM == this._state) {
                        
                        this._state = STATE_TO;
                        let s = "";
                        cfg.to_emails.forEach((em,i)=>{
                            //if (i > 0) {
                            //    s += ";";
                            //}
                            s += "RCPT TO:";
                            s += ("<"+em.addr+">\r\n");
                        });
                        //s += "\r\n";
                        this.sendMsg(s);
                        //this.sendMsg("RCPT TO: <" + to_addr + ">\r\n");
                    } else if (STATE_TO == this._state) {

                        this._state = STATE_DATA;
                        this.sendMsg("DATA\r\n");

                    } else if (STATE_END == this._state) {

                        this._state = STATE_QUIT;
                        this.sendMsg("QUIT\r\n");

                    }
                } else if ("334" == cod) {
                    if (STATE_AUTH == this._state) {
                        helper.log("["+this._name+":recvcb] send user:", cfg.user);
                        this._state = STATE_USER;
                        this.sendBase64(cfg.user);
                        this.sendMsg('\r\n');
                    } else if (STATE_USER == this._state) {
                        helper.log("["+this._name+":recvcb] send pass:", cfg.pass);
                        this._state = STATE_PASS;
                        this.sendBase64(cfg.pass);
                        this.sendMsg('\r\n');
                    }
                } else if ("235" == cod) {
                    if (STATE_PASS == this._state) {
                        
                        this._state = STATE_FROM;
                        this.sendMsg("MAIL FROM: <" + cfg.from_addr + ">\r\n");

                    }
                } else if ("354" == cod) {
                    if (STATE_DATA == this._state) {
                        // BODY
                        let s_head = "From: \"" + cfg.from_name + "\" <" + cfg.from_addr + ">\r\n";
                        s_head += "To:";
                        cfg.to_emails.forEach((em,i)=>{
                            s_head += ("\"" + em.name + "\" <" + em.addr + ">;");
                        });
                        s_head += "\r\n";
                        s_head += "Subject: " + cfg.subject + "\r\n";
                        s_head += "Content-Type: multipart/mixed; charset=utf-8; boundary="+ BOUND;
                        s_head += "\r\n\r\n";
 
                        this._state = STATE_HEAD;
                        this.sendMsg(s_head);

                        let s_body = "--" + BOUND +"\r\n";
                        s_body += "Content-Type: text/plain; charset=utf-8\r\n";
                        s_body += "Content-Disposition: \r\n";
                        s_body += "Content-Transfer-Encoding: 8bit\r\n\r\n";
                        s_body += cfg.body;
                        s_body += "\r\n\r\n";

                        this._state = STATE_BODY;
                        this.sendMsg(s_body);

                        if (cfg.attachs.length > 0) {
                            this.doAttachsNext(cfg.attachs, 0, ()=>{
                                this._state = STATE_END;
                                this.sendMsg("--" + BOUND +"--\r\n.\r\n");
                            }, cfg.attach_no_base64);
                        } else {
                            this._state = STATE_END;
                            this.sendMsg("--" + BOUND +"--\r\n.\r\n");
                        } 

                    }
                } else if ("221" == cod) {
                    if (STATE_QUIT == this._state) {
                        this._state = STATE_IDLE;
                        helper.log("["+this._name+":recvcb] disconnect");
                        this._com.disconnect();
                        this._com = null;
                        setTimeout(()=>{ callback(null); }, 0);
                    }
                } else if ("502" == cod || "554" == cod) {
                    this._state = STATE_QUIT;
                    this.sendMsg("QUIT\r\n");
                } else {
                    helper.logYellow("["+this._name+":recvcb] unknown cod:", cod);
                }
            } else {
                helper.log("["+this._name+":recvcb] NOT find cod.");
                callback(new Error("NOT find cod."));
            }
        });
    }
    doAttachsNext(objs, index, callback, attach_no_base64) {
        if (index >= objs.length) {
            callback();
        } else {
            let f = objs[index];
            helper.log("["+this._name+":doAttachsNext] f:", f);
            let file_info = path.parse(f);
            helper.log(file_info);
            fs.readFile(f, (e,d)=>{
                if (e) {
                    helper.logRed("["+this._name+":doAttachsNext] e:", e.message);
                } else {
                    let s_send = "--" + BOUND +"\r\n";  
                    s_send += "Content-Type: application/octet-stream;\r\n";  
                    s_send += " name=\"";  
                    s_send += (file_info.base);  
                    s_send += "\"";  
                    s_send += "\r\n";

                    if (helper.isNullOrUndefined(attach_no_base64)) {
                        s_send += "Content-Transfer-Encoding: base64\r\n";
                    }
                    s_send += "Content-Disposition: attachment;\r\n";
                    s_send += " filename=\"";
                    s_send += (file_info.base);
                    s_send += "\"";

                    s_send += "\r\n";
                    s_send += "\r\n";

                    this._state = STATE_ATTACHPART;
                    this.sendMsg(s_send);

                    let FILE_BLOCK = 1024*8;
                    let len_send = 0;
                    while (len_send < d.length) {
                        let block_len = FILE_BLOCK;
                        if (d.length - len_send < FILE_BLOCK) {
                            block_len = d.length-len_send;
                        }
                        let b_in = d.slice(len_send, len_send+block_len);

                        this._state = STATE_ATTACHPART;
                        if (helper.isNullOrUndefined(attach_no_base64)) {
                            this.sendBase64(b_in);
                        } else {
                            this.sendMsg(b_in);
                        }

                        len_send += block_len;

                        helper.log("len_send:", len_send, ", d.len:", d.length);
                    }

                    this._state = STATE_ATTACHDONE;

                    this.doAttachsNext(objs, index+1, callback, attach_no_base64);
                }
            });
        }
    }
    sendBase64(msg) {
        helper.log("["+this._name+":sendBase64] msg:", msg);
        let buf_msg = Buffer.from(msg);
        let en_msg = buf_msg.toString('base64');
        this.sendMsg(en_msg);
    }
    sendMsg(msg) {
        if ('string' == typeof(msg)) {
            helper.log("["+this._name+":sendMsg] send:", msg.replace( /\r/g, '\\r').replace(/\n/g, '\\n').slice(0,512) + (msg.length>512?"...":""));
        } else {
            helper.log("["+this._name+":sendMsg] send:", msg.length);
        }
        let buf_send = Buffer.from(msg);
        this._com.send(buf_send);
    }
    end() {
        if (false == helper.isNullOrUndefined(this._com)) {
            this._com.disconnect();
        }
        this._com = null;
        this._state = STATE_IDLE;
    }
}


module.exports = mailsender;
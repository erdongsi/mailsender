// 利用 net 模块封装的 通讯模块

const net = require("net");

const helper = require("./helper");

class comm {
    
    constructor() {
        this._socket = null;
    }    
    
    connect(ip, port, connectcb, recvcb) {
        helper.log("[comm:connect] (",ip,",",port,",connectcb[",(helper.isNullOrUndefined(connectcb)?"null":"func"),"],recvcb[",(helper.isNullOrUndefined(recvcb)?"null":"func"),"]) >>>>>");

        if (false == helper.isNullOrUndefined(this._socket)){
            helper.log("[comm:connect] last socket is exist!");
            return;
        }

        this._socket = new net.Socket({
            //fd: null,
            readable: false,
            writable: false,
            allowHalfOpen: false
        });

        helper.log("[comm:connect] connect(",ip,":",port,") ...");
        this._socket.connect({
            port: parseInt(port), 
            host: ip
        });

        this._socket.setKeepAlive(true);

        this._socket.setNoDelay(true);

        this._socket.on("close", ()=>{
            helper.log("[comm:connect] event(close)")

            // Do not reuse old socket, old-socket maybe still working on something.
            this._socket = null;
            setTimeout(()=>{
                if (false == helper.isNullOrUndefined(connectcb)) {
                    connectcb(false);
                }
            })
        });

        this._socket.on("connect", ()=>{
            helper.log("[comm:connect] event(connect)");
            if (false == helper.isNullOrUndefined(connectcb)) {
                connectcb(true);
            }
        });

        this._socket.on("data", (dat)=>{
            //helper.log("[comm:connect] event(data)[", dat.length,"]");

            if (false == helper.isNullOrUndefined(recvcb)){
                recvcb(dat);
            }
        });

        this._socket.on("drain", ()=>{
            helper.log("[comm:connect] event(drain)");
        });

        this._socket.on("end", ()=>{
            helper.log("[comm:connect] event(end)");
        });

        this._socket.on("error", (err)=>{
            helper.log("[comm:connect] event(error):", err.toString());
            if (false == helper.isNullOrUndefined(connectcb)) {
                connectcb(false);
            }
        });

        this._socket.on("timeout", ()=>{
            helper.log("[comm:connect] event(timeout)");

            helper.log("[comm:connect] _socket.connecting:",this._socket.connecting);
            if (false != this._socket.connecting) {
                // Using end(), event(close) will be emitted after 20s. Don't know why.
                //this._socket.end();

                // Using destroy(), event(close) will be emitted immediately.
                this._socket.destroy();
            }
        });
    }

    disconnect() {
        helper.log("[comm:disconnect] () >>>");

        if (helper.isNullOrUndefined(this._socket)){
            helper.log("[comm:disconnect] socket is null.");
            return helper.ERR_SOCK_NULL;
        }

        this._socket.destroy();
        return helper.ERR_SOCK_CONNECTING;
    }

    send(bytes) {
        //helper.log("[comm:send] (",bytes,"[",bytes.length,"]) >>>>>");

        if (helper.isNullOrUndefined(this._socket)){
            helper.log("[comm:send] socket is null.");
            return helper.ERR_SOCK_NULL;
        }
        if (this._socket.connecting) {
            helper.log("[comm:send] socket is connecting.");
            return helper.ERR_SOCK_CONNECTING;
        }

        //helper.log("[comm:send] typeof(bytes) is ", typeof(bytes));

        let _buf = new Buffer(bytes)

        if (true == this._socket.write(_buf)) {
            return helper.ERR_OK;
        } else {
            return helper.ERR_WRITE_FAIL;
        }
    }
}

module.exports = comm;
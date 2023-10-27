"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const WebSocket = __importStar(require("ws"));
const wss = new WebSocket.Server({ port: 8080 });
const players = new Map();
const TICKRATE = 60;
const PLAYER_RESPAWN_TIME = 5000;
let latestTime = performance.now();
wss.on('connection', function connection(ws) {
    ws.uuid = (0, uuid_1.v4)();
    ws.noDelay = true;
    ws.send(JSON.stringify({ type: 'first', playerKey: ws.uuid, hp: 100, haveBeenHit: false }));
    players.set(ws.uuid, {
        hp: 100
    });
    ws.on('connected', function () {
        console.log('connected');
    });
    ws.on('error', console.error);
    ws.on('message', function message(data) {
        var _a, _b, _c;
        const clientData = JSON.parse(data);
        const player = players.get(clientData.playerKey);
        /*         console.log('received:', clientData)
         */ if (clientData.type === 'SEND_PLAYER_INFO') {
            /*             if (player.hp < 1) clientData.animation = 'Death'
             */ players.set(clientData.playerKey, Object.assign(Object.assign({}, player), { position: [
                    (_a = clientData.position.x) !== null && _a !== void 0 ? _a : 0,
                    (_b = clientData.position.y) !== null && _b !== void 0 ? _b : 0,
                    (_c = clientData.position.z) !== null && _c !== void 0 ? _c : 0
                ], velocity: [clientData.velocity.x, clientData.velocity.y, clientData.velocity.z], rotation: clientData.rotation, delta: clientData.delta, animation: clientData.animation, haveBeenHit: false }));
        }
        else if (clientData.type === 'PLAYER_HIT') {
            if (player.hp > 0) {
                players.set(clientData.playerKey, Object.assign(Object.assign({}, player), { hp: player.hp - Math.floor(Math.random() * 5 + 20), haveBeenHit: true }));
            }
            else if (player.hp < 1) {
                players.set(clientData.playerKey, Object.assign(Object.assign({}, player), { animation: 'Death' }));
            }
        }
        else if (clientData.type === 'RESPAWN_REQUEST') {
            players.set(clientData.playerKey, Object.assign(Object.assign({}, player), { position: [
                    5,
                    10,
                    5
                ], hp: 100, animation: 'Idle' }));
        }
    });
    /*  setInterval(() => {
         ws.send(JSON.stringify(Array.from(players)));
     }, 100) */
    ws.on('close', function () {
        players.delete(ws.uuid);
    });
    function tick(timePassed) {
        latestTime = Date.now();
        ws.send(JSON.stringify(Array.from(players)));
    }
    setInterval(() => tick(Date.now() - latestTime), 1000 / TICKRATE);
});
process.on('uncaughtException', function (err) {
    console.error(err.stack);
    process.exit(1);
});
process.on('unhandledRejection', function (err) {
    console.error(err.stack);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
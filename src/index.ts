import { v4 as uuidv4 } from "uuid";
import * as WebSocket from 'ws';
import { performance } from 'perf_hooks'
const wss = new WebSocket.Server({ port: 8080 }) as any;

interface Players {
    position: [number, number, number]
}

const players: any = new Map()
const TICKRATE = 60
const PLAYER_RESPAWN_TIME = 5000

let latestTime = performance.now()

wss.on('connection', function connection(ws: any, req: any) {

    ws.noDelay = true


    /*     ws.send(JSON.stringify({ type: 'first', playerKey: ws.uuid, hp: 100, haveBeenHit: false }))
     */

    ws.on('connected', function () {
        console.log('connected')
    })

    ws.on('error', console.error);


    ws.on('message', function message(data: any) {
        const clientData = JSON.parse(data)
        const player = players.get(clientData.playerKey)
        if (clientData.type === 'SEND_PLAYER_INFO') {
            /*if (player.hp < 1) clientData.animation = 'Death'
 */
            if (clientData.position.y < -30) {
                clientData.playerHP = 0
            }
            players.set(clientData.playerKey, {
                ...player,
                position: [
                    clientData.position.x ?? 0,
                    clientData.position.y ?? 0,
                    clientData.position.z ?? 0
                ],
                velocity: [clientData.velocity.x, clientData.velocity.y, clientData.velocity.z],
                rotation: clientData.rotation,
                delta: clientData.delta,
                animation: clientData.animation,
                haveBeenHit: false
            })
        } else if (clientData.type === 'PLAYER_HIT') {
            if (player.hp > 0) {
                players.set(clientData.playerKey, {
                    ...player,
                    hp: player.hp - Math.floor(Math.random() * 5 + 20),// random damage between 20-25
                    haveBeenHit: true
                })
            } else if (player.hp < 1) {
                players.set(clientData.playerKey, {
                    ...player,
                    animation: 'Death'
                })
            }
        } else if (clientData.type === 'RESPAWN_REQUEST') {
            players.set(clientData.playerKey, {
                ...player,
                position: [
                    1,
                    1,
                    1
                ],
                hp: 100,
                animation: 'Idle'
            })
        } else if (clientData.type === 'FIRST_FROM_CLIENT') {
            if (players.get(clientData.playerId)) return;
            ws.uuid = clientData.playerId
            players.set(clientData.playerId, {
                hp: clientData.hp ?? 100
            })
        }
    });
    /*  setInterval(() => {
         ws.send(JSON.stringify(Array.from(players)));
     }, 100) */

    ws.on('close', function () {
        players.delete(ws.uuid)
    })
    function tick(timePassed: number) {
        latestTime = Date.now()
        ws.send(JSON.stringify(Array.from(players)));
    }
    setInterval(() => tick(Date.now() - latestTime), 1000 / TICKRATE)
});

process.on('uncaughtException', function (err) {
    console.error(err.stack)
    process.exit(1)
})
process.on('unhandledRejection', function (err: any) {
    console.error(err.stack)
    process.exit(1)
})
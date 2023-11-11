import { v4 as uuidv4 } from "uuid";
import * as WebSocket from 'ws';
import { performance } from 'perf_hooks'
const wss = new WebSocket.Server({ port: 8080 }) as any;

interface Players {
    position: [number, number, number]
}

const players: any = new Map(/* [
    ['bot1', { hp: 100, isBot: true, position: [5, 1, 5] }],
    ['bot2', { hp: 100, isBot: true, position: [15, 1, 15] }],
    ['bot3', { hp: 100, isBot: true, position: [25, 1, 25] }]] */
)

/* const monsters: any = new Map([
    ['slot1', { hp: 100, name: 'Skeleton', position: [5, -1, 1] }],
    ['slot2', { hp: 100, name: 'Skeleton', position: [5, -1, 9] }],
    ['slot3', { hp: 100, name: 'Skeleton', position: [1, -1, 23] }]
])

const eggs: any = new Map([
    [uuidv4(), { hp: 100, name: 'Egg', position: [8, 0, 11] }]
]) */
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
                ws.send(JSON.stringify({
                    type: 'DEATH'
                }))
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
            const remainingHP = player.hp - Math.floor(Math.random() * 7 + 20) // random damage between 20-25
            if (remainingHP > 0) {
                players.set(clientData.playerKey, {
                    ...player,
                    hp: remainingHP
                })

                wss.clients.forEach((client: any) => {
                    if (client.uuid == clientData.playerKey) {
                        client.send(JSON.stringify({
                            type: 'YOU_HAVE_BEEN_HIT'
                        }))
                    }
                })
            } else if (remainingHP < 1) {
                players.set(clientData.playerKey, {
                    ...player,
                    hp: remainingHP
                })

                wss.clients.forEach((client: any) => {
                    if (client.uuid == clientData.hitBy) {
                        client.send(JSON.stringify({
                            type: 'YOU_KILLED_A_PLAYER',
                        }))
                    }
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
            if (players.get(clientData.playerId)) {
                return;
            }

            ws.uuid = clientData.playerId
            players.set(clientData.playerId, {
                hp: clientData.hp ?? 100
            })
        } else if (clientData.type === 'MONSTER_KILLED') {
            if (clientData.slot == 'EGG') {
                ws.send(JSON.stringify({
                    "type": "SLOT_DROP",
                    drop: [{ id: 'Coin', quantity: 3, exp: 3 }]
                }))
            } else {
                ws.send(JSON.stringify({
                    "type": "SLOT_DROP",
                    drop: [{ id: 'Coin', quantity: 1, exp: 1 }]
                }))
            }
        } else if (clientData.type === 'RED_POTION') {
            players.set(ws.uuid, {
                ...player,
                hp: (player.hp + 10 > 100 ? 100 : player.hp + 10)
            })
        }
        /* else if (clientData.type === 'MONSTER_HIT') {
            const monster = monsters.get(clientData.monsterId)
            if (!monster) return;
            const remainingHP = monster.hp - Math.floor(Math.random() * 9 + 20)
            if (remainingHP < 0) monsters.delete(clientData.monsterId)
            monsters.set(clientData.monsterId, {
                ...monster,
                hp: remainingHP
            })
        } else if (clientData.type === 'EGG_HIT') {
            const egg = eggs.get(clientData.eggId)
            if (!egg) return;
            const remainingHP = egg.hp - Math.floor(Math.random() * 3 + 5)
            if (remainingHP < 0) {
                eggs.delete(clientData.eggId)
                setTimeout(() => {
                    eggs.set(uuidv4(), { hp: 100, name: 'Egg', position: [8, 0, 11] })
                }, 5000)
            } else if (remainingHP % 5 == 0) monsters.set(uuidv4(), {
                hp: 100,
                name: 'Skeleton',
                position: [
                    egg.position.x + 2, 0, egg.position.z + 2
                ]
            })

            if (remainingHP > 0 ){
                eggs.set(clientData.eggId, {
                    ...egg,
                    hp: remainingHP
                })
            }
        } */
    });
    /*  setInterval(() => {
         ws.send(JSON.stringify(Array.from(players)));
     }, 100) */

    ws.on('close', function () {
        players.delete(ws.uuid)
    })
    function tick(timePassed: number) {
        latestTime = Date.now()
        const player = players.get(ws.uuid)
        if (player?.hp < 1) {
            players.set(ws.uuid, {
                ...player,
                hp: 0,
                animation: 'Death'
            })
        }

        /*    players.forEach((player: any) => {
               if (!player?.isBot) return;
               const botPosition = player?.position
               let closest: number = 999
               players.forEach((user: any) => {
                   if (!user.position || botPosition) return;
                   const distance = {
                       x: Math.abs(botPosition[0] - user.position[0]),
                       z: Math.abs(botPosition[2] - user.position[2])
                   }
                   const distanceVector = Math.floor(Math.sqrt(distance.x ** 2 + distance.z ** 2))
                   if (distanceVector < closest) closest = distanceVector
                   players.set(player.uuid, {
                       ...player,
                       closest
                   })
               }
               )
           }) */
        ws.send(JSON.stringify(Array.from(players)));
        /*     ws.send(JSON.stringify({ monsters: Array.from(monsters), type: 'MONSTERS' }))
            ws.send(JSON.stringify({ eggs: Array.from(eggs), type: 'EGGS' })) */
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
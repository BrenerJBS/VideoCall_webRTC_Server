require('dotenv').config()
const twilio = require('twilio')
const cors = require('cors')
const express = require('express')
const socket = require('socket.io')

const PORT = process.env.PORT || 4000;

const app = express();

app.use(cors())

app.get('/', (req, res) => {
    res.send({api: 'video-call-api'})
})

app.get('/api/get-turn-credentials', (req, res) => {
    const accountSid = process.env.ACCOUNTSID;
    const authToken = process.env.AUTHOKEN;
    //console.log(accountSid)
    //console.log(authToken)
    const client = twilio(accountSid,authToken)
    client.tokens.create().then((token) => res.send({token}))   
})

const server = app.listen(PORT, () => {
    console.log('server is listening on '+ PORT)
    //console.log(`http://localhost:${PORT}`)
})

const io = socket(server, { 
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

let peers = []

io.on('connection', (socket) => {
    socket.emit('connection', null);
    //console.log("new user connected")
    //console.log(socket.id)

    socket.on('register-new-user', (data) => {
        //console.log('register-new-user')
        //console.log('peers.filter')
        //console.log(peers.filter((peer) => peer.classId === data.classId))
        //console.log('peers')
        //console.log(peers)
        peers.push({
            username:data.username,
            socketId: data.socketId,
            classId: data.classId
        })

        socket.join(data.classId);
        
        const peersClass = peers.filter((peer) => peer.classId === data.classId)

        io.to(data.classId).emit("list-users", peersClass);
        /*socket.broadcast
        .to(data.classId)
        .emit("list-users", peersClass)*/
        
        //console.log("register-new-user")
        //console.log(peersClass)
    })

    // listenners relacionado ao videocall
    

    socket.on('pre-offer', (data) => {
        //console.log("pre-offer")
        io.to(data.callee.socketId).emit('pre-offer' , {
            callerUsername: data.caller.username,
            callerSocketId: socket.id
        })
    })

    socket.on('pre-offer-answer', (data) => {
        //console.log("pre-offer-answer")       
        //console.log("-")
        io.to(data.callerSocketId).emit('pre-offer-answer' , {
            answer: data.answer,
        })
    })

    socket.on('webRTC-offer', (data) => {
        //console.log("webRTC-offer")              
        //console.log("-")
        io.to(data.callerSocketId).emit('webRTC-offer' , {
            offer: data.offer,
        })
    })

    socket.on('webRTC-answer', (data) => {
        //console.log("webRTC-answer")
       
        //console.log("-")
        io.to(data.callerSocketId).emit('webRTC-answer' , {
            answer: data.answer,
        })
    })
    

    socket.on('webRTC-candidate', (data) => {
        //console.log("webRTC-candidate")
        //console.log(data)
        io.to(data.connectedUserSocketId).emit('webRTC-candidate' , {
            candidate: data.candidate,
        })
    })

    socket.on('user-hanged-up', (data) => {
        //console.log("user-hanged-up")
       
        //console.log("-")
        io.to(data.connectedUserSocketId).emit('user-hanged-up')
    })

    socket.on('disconnect', () => {
        //console.log('User disconnect')
        const userDisconnect = peers.find((peer) => peer.socketId === socket.id)          
        peers = peers.filter((peer) => peer.socketId !== socket.id)        
        if (userDisconnect){
            const peersClass = peers.filter((peer) => peer.classId === userDisconnect.classId)
            io.to(userDisconnect.classId).emit("list-users", peersClass);
        }
    })

})
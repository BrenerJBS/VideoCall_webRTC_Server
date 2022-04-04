const express = require('express')
const socket = require('socket.io')

const PORT = process.env.PORT || 4000;

const app = express();

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
    console.log("new user connected")
    console.log(socket.id)

    socket.on('register-new-user', (data) => {
        peers.push({
            username:data.username,
            socketId: data.socketId
        })

        socket.broadcast      
        .emit("list-users", peers)
        

        console.log("register-new-user")
        console.log(peers)
    })

    // listenners relacionado ao videocall
    

    socket.on('pre-offer', (data) => {
        console.log("pre-offer")
        io.to(data.callee.socketId).emit('pre-offer' , {
            callerUsername: data.caller.username,
            callerSocketId: socket.id
        })
    })

    socket.on('pre-offer-answer', (data) => {
        console.log("pre-offer-answer")       
        console.log("-")
        io.to(data.callerSocketId).emit('pre-offer-answer' , {
            answer: data.answer,
        })
    })

    socket.on('webRTC-offer', (data) => {
        console.log("webRTC-offer")              
        console.log("-")
        io.to(data.callerSocketId).emit('webRTC-offer' , {
            offer: data.offer,
        })
    })

    socket.on('webRTC-answer', (data) => {
        console.log("webRTC-answer")
       
        console.log("-")
        io.to(data.callerSocketId).emit('webRTC-answer' , {
            answer: data.answer,
        })
    })
    

    socket.on('webRTC-candidate', (data) => {
        console.log("webRTC-candidate")
        //console.log(data)
        io.to(data.connectedUserSocketId).emit('webRTC-candidate' , {
            candidate: data.candidate,
        })
    })

    socket.on('user-hanged-up', (data) => {
        console.log("user-hanged-up")
       
        console.log("-")
        io.to(data.connectedUserSocketId).emit('user-hanged-up')
    })

    socket.on('disconnect', () => {
        console.log('User disconnect')
        console.log(socket.id)
        peers = peers.filter((peer) => peer.socketId !== socket.id)
        console.log(peers)
    })

})
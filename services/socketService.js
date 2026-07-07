import { Server } from 'socket.io'

let io

export const initSocket = (server) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://192.168.43.72:3000',
        process.env.FRONTEND_URL
    ].filter(Boolean)

    io = new Server(server, {
        cors: { 
            origin: (origin, callback) => {
                // Allow requests with no origin (like mobile apps, Postman, etc.)
                if (!origin) return callback(null, true)
                
                // Check if origin is in allowed list
                if (allowedOrigins.indexOf(origin) !== -1) {
                    return callback(null, true)
                }
                
                // Allow any *.vercel.app subdomain (for preview deployments)
                if (origin && origin.match(/^https:\/\/.*\.vercel\.app$/)) {
                    return callback(null, true)
                }
                
                // In development, allow all origins for easier testing
                if (process.env.NODE_ENV === 'development') {
                    callback(null, true)
                } else {
                    callback(new Error('Not allowed by CORS'))
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        },
        // Add transport options for better mobile support
        transports: ['websocket', 'polling'],
        allowEIO3: true
    })

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`)

        socket.on('join-session', (sessionId) => {
            socket.join(sessionId)
            console.log(`Socket ${socket.id} joined session ${sessionId}`)
        })

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`)
        })
    })

    return io
}

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized')
    }
    return io
}

export const emitNewQR = (sessionId, qrImage, pin) => {
    if (io) {
        io.to(sessionId).emit('qr-refreshed', { qrImage, pin })
        io.to(sessionId).emit('new-qr', { qrImage, pin })
    }
}

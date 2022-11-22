/*
 Basic Example: Send text and multimedia
*/
// const { Boom } = require('@hapi/boom');
const makeWASocket = require('@adiwajshing/baileys').default
const { BufferJSON, useMultiFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
// const QRCode = require('qrcode');
const fs = require('fs');

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })
    // this will be called as soon as the credentials are updated
    sock.ev.on ('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            if (typeof lastDisconnect !== 'undefined' && lastDisconnect !== null) {
                const shouldReconnect = typeof lastDisconnect !== 'undefined' && typeof lastDisconnect.error !== 'undefined' && typeof lastDisconnect.error.output !== 'undefined' && typeof lastDisconnect.error.output.statusCode !== 'undefined' && lastDisconnect.error.output.statusCode != DisconnectReason.loggedOut
                if(shouldReconnect) {
                    connectToWhatsApp()
                }
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    sock.ev.on('messages.upsert', async ({messages}) => {
        console.log(messages)
        const m = messages[0]
        if (!m.message) return // if there is no text or media message
        const messageType = Object.keys (m.message)[0] // get what type of message it is -- text, image, video
        if (messageType === 'conversation') {
            if (typeof m.key.remoteJid !== 'undefined' &&  m.key.remoteJid !== null) {
                const senderId = m.key.remoteJid
                const senderMessage = m.message[messageType]
                if (senderMessage === 'send text') {
                    // send a text no media
                    await sock.sendMessage(senderId, {
                        text: 'Hello There'
                    })
                } else if (senderMessage === 'send image') {
                    // send n image
                    await sock.sendMessage(senderId, { 
                        image: fs.readFileSync("Media/static_image.jpg"), 
                        caption: "hello!"
                    })
                } else if (senderMessage === 'send gif') {
                    // send a gif or video
                    await sock.sendMessage(senderId, { 
                        video: fs.readFileSync("Media/gif.mp4"), 
                        caption: "hello!",
                        gifPlayback: true
                    })
                    
                }  else if (senderMessage === 'send audio') {
                    // send an audio
                    await sock.sendMessage(senderId, { 
                        audio: { url: "./Media/audio.mp3" }, mimetype: 'audio/mp4' // can send mp3, mp4, & ogg
                    })
                    
                } else if (senderMessage === 'send link') {
                    // send a link
                    await sock.sendMessage(senderId, {
                        text: 'Hi, this was sent using https://github.com/rezadaulay/javascript-example-of-whatsapp-baileys'
                    })
                } else if (senderMessage === 'send button') {
                    // send buttons
                    const buttons = [
                        {buttonId: 'id1', buttonText: {displayText: 'Button 1'}, type: 1},
                        {buttonId: 'id2', buttonText: {displayText: 'Button 2'}, type: 1},
                        {buttonId: 'id3', buttonText: {displayText: 'Button 3'}, type: 1}
                    ]
                    
                    const buttonMessage = {
                        image: fs.readFileSync("Media/static_image.jpg"),
                        caption: "Hi it's button message",
                        footer: 'Hello World',
                        buttons: buttons,
                        headerType: 4
                    }
                    await sock.sendMessage(senderId, buttonMessage)
                    
                }
            }
        } else {
            console.log(m)
        }
    })
}
// run in main file
connectToWhatsApp()

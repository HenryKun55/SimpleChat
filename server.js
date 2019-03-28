'use strict'
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.set('view engine', 'html');

// Load module
const mysql = require('mysql');
// Initialize pool
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'henrique9308002300',
    database: 'helpdesk'
})

// Log any errors connected to the db
db.connect(function(err){
    if (err) console.log(err);
    console.log('Conectou!');
})
/////////////////////////////////////

let usersOn = [];

    //Verifying the position used to the array sort
    function positions(arr, element) {
        for (var i = 0; i < arr.length; i++) {
            //console.log(arr[i]);
            if (arr[i] === element) {
                return true;
            }
        }
    return false;
    }

    //Remove the Selected Array
    function contains(arr, element) {
        for (var i = 0; i < arr.length; i++) {
            //console.log(arr[i]);
            if (arr[i] === element) {
                arr.splice(i, 1);
                return true;
            }
        }
        return false;
    }

io.sockets.on('connection', (socket) => {

    socket.on('join', function (data) {

        if(!positions(usersOn, data.name)){
            socket.name = data.name;
            usersOn.push(data.name);
        }

        setInterval(function(){
            db.query('SELECT * FROM chat WHERE `from` = ? OR `to` = ? AND `checked` = ?', [data.name, data.name, 1], function(err, data){
                if(err){
                    console.log(err);
                }
                socket.emit('checkedMessages', data);
            })
        }, 1000);

        setInterval(function(){
            db.query('SELECT * FROM chat WHERE `to` = ? AND `checked` = ?', [data.name, 0], function(err, data){
                if(err){
                    console.log(err);
                }    
                socket.emit('uncheckedMessages', data);
            })
        }, 1000);

        setInterval(function(){
            db.query('SELECT COUNT(id) as count FROM chat WHERE `to` = ? AND `checked` = ?', [data.name, 0], function(err, data){
                if(err){
                    console.log(err);
                }    
                socket.emit('notifications', data);
            })
        }, 1000);
    });

    socket.on('disconnect', function () {
        contains(usersOn, socket.name);
    });

    socket.on('sendMessage', data => {
        console.log('O Usuário '+data.from+' enviou: '+data.message+ '\n para :'+data.to);
        //let message = JSON.parse(data.message);
        console.log(data.message);

        db.query('INSERT INTO chat SET ?', data , function(err, result){
            if(err){
                console.log(err);
            }
            console.log(result);
            data.id = result.insertId;
            socket.broadcast.emit('receiveMessage', data);
        })
    });

    socket.on('checking', data => {
        db.query('UPDATE chat SET checked = ? WHERE id = ?', [data.checked, data.id], function(err, result){
            if(err){
                console.log(err);
            }
            console.log(result);
        });
    });

    setInterval(function(){
        socket.emit('Usuários Conectados', usersOn);  
    }, 1000);

})

server.listen(8001, () => 
    console.log('Socket Iniciado!')
)

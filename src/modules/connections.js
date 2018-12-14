const Events = require('events'),
    WebSocket = require('ws');

/**
 * Класс отвечающий за WebSoket-подключения пользователей
 * 
 * @param {object} opts 
 */
var Connections = function(server){
    this._wsServer = new WebSocket.Server({ server: server });
    this._init();
}

Connections.prototype.__proto__ = Events.prototype;

Connections.prototype._init = function() {
    this._wsServer.on('connection', (websocket)=>{

        
        websocket.on('message', (message)=>{
            try {
                var {event, data} = JSON.parse(message);
            } catch(e) {
                console.log('Не удалось разобрать запрос')
            }
            if (event) {
                this._onEvent(websocket, event, data);
            }
        });

        this.emit('connected', (models)=>{
            this._send(websocket, 'models', models);
        });
    });
}

Connections.prototype._onEvent = function(websocket, event, data) {
    if (event === 'bounds') {
        websocket.bounds = data;
        this.emit('bounds', data, (cars)=>{
            this._send(websocket, 'loaded', cars)
        })
    }
}

Connections.prototype._send = function(websocket, event, data) {
    if (websocket.readyState !== WebSocket.OPEN) {
        return;
    }

    let message = {
        event: event,
        data: data
    }
    websocket.send(JSON.stringify(message));
}

Connections.prototype._broadcast = function(event, data) {
    this._wsServer.clients.forEach((websocket) => {
        this._send(websocket, event, data);
    });
}

Connections.prototype.sendModels = function(models) {
    if (Object.keys(models).length === 0) {
        return;
    }
    this._broadcast('models', models);
}

Connections.prototype.sendAdded = function(added) {
    if (Object.keys(added).length === 0) {
        return;
    }

    this._broadcast('added', added);
}

Connections.prototype.sendUpdated = function(updated) {
    if (Object.keys(updated).length === 0) {
        return;
    }

    this._broadcast('updated', updated);
}

Connections.prototype.sendRemoved = function(removed) {
    if (removed.length === 0) {
        return;
    }

    this._broadcast('removed', removed);
}


Connections.prototype.__proto__ = Events.prototype;

module.exports = Connections;
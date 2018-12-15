const Events = require('events'),
    WebSocket = require('ws'),
    Connection = require('./connection');

/**
 * Класс отвечающий за WebSocket-сервер и подключения пользователей
 * 
 * @param {object} opts 
 */
var Connections = function(server){
    this._connections = new Set();

    this._wsServer = new WebSocket.Server({ server: server });
    this._wsServer.on('connection', (ws)=>{
        this._createConnection(ws);
    });
  
}

Connections.prototype.__proto__ = Events.prototype;

/**
 * Метод создает новый экземпляр соединения, сохраняет его в коллекцию
 * и навешивает обработчики событий
 * 
 * @param {object} ws экземпляр объекта WebSocket
 */
Connections.prototype._createConnection = function(ws) {
    let connection = new Connection(ws);
    
    // При запросе списка машин в координатах
    connection.on('load', (bounds, callback) => {
        // Отправляем событие запроса машин в координатах
        this.emit('load', bounds, callback);
    });

    // При закрытии соединения
    connection.on('close', (connection) => {
        // Уничтожаем о нем информацию
        this._connections.delete(connection);
    });
   
    // Добавляем соединение в коллекцию
    this._connections.add(connection);

    // Отправляем событие о новом соединении
    this.emit('connected', (models)=>{
        connection.send('models', models);
    });
}

/**
 * Метод отправляем событие и данные по всем действующим соединениям
 */
Connections.prototype.broadcast = function(event, data) {
    this._connections.forEach((connection) => {
        connection.send(event, data);
    });
}

module.exports = Connections;
const Events = require('events'),
    ws = require('ws');

/**
 * Класс отвечающий за WebSoket-подключения пользователей
 * 
 * @param {object} opts 
 */
var Connections = function(opts){
    this._opts = opts;
}

Connections.prototype.__proto__ = Events.prototype;

module.exports = Connections;
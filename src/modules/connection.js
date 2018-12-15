const
    Events = require('events'),
    utils = require('./utils');


/**
 * Класс для экземпляра WebSocket подключения, отвечающий за дополнительную фильтрацию
 * 
 * @param {object} ws Экземпляр объекта WebSocket
 */
var Connection = function(ws) {
    this._bounds = null;
    this._ws = ws;

    this._ws.on('close', ()=>{
        this.emit('close', this);
    });
    
    this._ws.on('message', (message) => {
        this._onMessage(message, (event, data)=>{
            this._onEvent(event, data)
        });
    })
}

Connection.prototype.__proto__ = Events.prototype;

/**
 * Метод разбирает входящее сообщение
 * 
 * @param {string} message Строка входящего сообщения
 * @param {function} callback Функция, которая будет вызвана, если сообщение корректно разобрано. В функцию будут переданы аргументы event и data
 */
Connection.prototype._onMessage = function(message, callback) {
    try {
        var {event, data} = JSON.parse(message);
    } catch(e) {
        console.log('Не удалось разобрать запрос')
    }

    if (event) {
        callback(event, data);
    }
}

/**
 * Метод обрабатывает события от пользователя.
 * 
 * @param {string} event название события, по которому пришли данные
 * @param {any} data сами данные
 */
Connection.prototype._onEvent = function(event, data) {
    // В данном проекте есть только одно событие - установка координат
    if (event === 'bounds') {
        this._bounds = data;
        // Генерируем событие запроса автомобилей в координатах
        this.emit('load', this._bounds, (cars)=>{
            // И отправляем их пользователю
            this.send('loaded', cars);
        })
    }
}

/**
 * Метод фильтрует список добавленных или измененных автомобилей, сохраняя только те, что находятся в окне отображения
 * 
 * @param {array} cars Массив объектов автомобилей
 * @param {boolean} updated Признак фильтрации обновлений (по свойству coordinates_old)
 * @return {array} Отфильтрованный список автомобилей
 */
Connection.prototype._filter = function(cars, updated) {
    var filtered = [];
    
    cars.forEach((car)=>{
        if (utils.inBounds(updated ? car.coordinates_old : car.coordinates, this._bounds)) {
            filtered.push(car);
        }
    });

    return filtered;
}

/**
 * Метод отправляет пользователю событие и данные по нему
 * @param {string} event строка названия события
 * @param {any} data данные по этому событию
 */
Connection.prototype.send = function(event, data) {
    // Для событий added и updated - отфильтруем данные
    switch(event) {
        case 'added':
            data = this._filter(data);
            break;
        case 'updated':
            data = this._filter(data, true);
    }

    
    if (data.length === 0) {
        return;
    }

    let message = {
        event: event,
        data: data
    }

    if (this._ws.readyState !== 1 ) {
        return;
    }

    this._ws.send(JSON.stringify(message));
}

module.exports = Connection;
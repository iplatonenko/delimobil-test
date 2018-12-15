const 
    Events = require('events'),
    https = require('https');

/**
 * Класс отвечает за взаимодействие по REST API 
 * 
 * @param {object} urls Ссылки на запросы
 */
var Api = function(urls) {
    this._urls = urls;
    this._loops = { 
        cars: false // Выставляется в true, во время, запроса. Сделано для того, чтобы не был по таймеру запущен следующий запрос, если предыдущей не завершен
    }
}

Api.prototype.__proto__ = Events.prototype;

/**
 * Выполняет GET-запрос к API
 * 
 * @param {string} url Ссылка на запрос
 * @param {function} callback Функция, которая будет выполнена по окончанию запроса, в которую будут переданы аргументы error и result
 */
Api.prototype._request = function(url, callback) {
    https.get(url, (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
            data += chunk;
        });

        resp.on('end', () => {
            let response;
            try {
                response = JSON.parse(data);
            } catch (err) {
                console.log("Error: " + err.message, data);
                callback(err, { success: false} );
                return;
            }
            callback(undefined, response);
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
        callback(err);
    });
}

/**
 * Метод выполняет запрос на получение списка автомобилей
 * 
 * @param {function} callback Функция, которая будет выполнена при успешном получении списка
 */
Api.prototype._getCars = function(callback) {
    this._request(this._urls.cars, (err, response)=>{
        if (err) {
            return;
        }

        if (!response.success) {
            console.log('Cars not success');
            return;
        }

        callback(response.cars);
    });
}

/**
 * Метод запускает циклическое получение списка автомбилей
 * 
 * @param {number} period Период между запросами списков в миллисекундах
 */
Api.prototype.startLoops = function(period) {
    setInterval(()=>{
        if (this._loops.cars) {
            return;
        }
        this._loops.cars = true;
        this._getCars((cars) =>{
            this._loops.cars = false;
            this.emit('cars', cars);
        });
    }, period);
}

module.exports = Api;
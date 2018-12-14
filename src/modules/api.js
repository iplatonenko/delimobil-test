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
        cars: false
    }
}

Api.prototype.__proto__ = Events.prototype;

/**
 * Выполняет GET-запрос к API
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
                console.log("Error: " + err.message);
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

Api.prototype._getCars = function(callback) {
    this._request(this._urls.cars, (err, response)=>{
        if (err) {
            return;
        }

        if (response && !response.success) {
            console.log('Cars not success');
            return;
        }

        callback(response.cars);
    });
}

Api.prototype.startCarsLoop = function(period) {
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
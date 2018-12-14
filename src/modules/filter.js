const 
    Events = require('events'),
    utils = require('./utils');

/**
 * Класс отвечает за обработку информации о доступных автомбилях
 */
var Filter = function() {
    this._models = {};
    this._cars = {};
}

Filter.prototype.__proto__ = Events.prototype;


Filter.prototype._getRemoved = function(cars) {
    var removed = [];

    let current = cars.map((car)=>{
        return '' + car.id
    });

    for (let id in this._cars) {
        if (current.indexOf(id) > -1) {
            continue;
        }

        delete(this._cars[id]);
        removed.push(id);
    }

    return removed;
}

Filter.prototype._getModelsAddedUpdated = function(cars, callback) {
    var models = {};
    var added = {};
    var updated = {};

    for(let i in cars) {
        let car = cars[i];
        // 
        if (!this._models[car.model.name_full]) {
            this._models[car.model.name_full] = car.model;
            models[car.model.name_full] = car.model;
        }

        car = {
            id: car.id,
            model: car.model.name_full,
            fuel: parseInt(car.fuel),
            coordinates: [car.lat, car.lon]
        }

        if (!this._cars[car.id]) {
            this._cars[car.id] = car;
            added[car.id] = car;
            continue;
        }
        
        if (this._cars[car.id].fuel !== car.fuel || this._cars[car.id].coordinates[0] !== car.coordinates[0] || this._cars[car.id].coordinates[1] !== car.coordinates[1]) {
            this._cars[car.id] = car;
            updated[car.id] = car;
        }
    }

    callback(models, added, updated);
}

/**
 * Метод запускает обработку новой информации об автомобилях
 * 
 * @param {array} cars Массив с объектами автомобилей
 */
Filter.prototype.update = function(cars) {
    // Сначала проверяем какие автомобили пропали из нового списка
    let removed = this._getRemoved(cars);
    this.emit('removed', removed);

    // Ищем добавленные модели, автомобили и автомобили, информация о которых обновилась
    this._getModelsAddedUpdated(cars, (models, added, updated)=>{
        this.emit('models', models);
        this.emit('added', added);
        this.emit('updated', updated);
    });
}

/**
 * Метод возвращает информацию об известных на данный момент моделях автомобилей
 */
Filter.prototype.getAllModels = function() {
    return this._models;
}

/**
 * Метод возвращает информацию об автомобилях, расположенных в 
 * диапазоне координат верхнего левого и правого нижнего углов
 * 
 * @param {array} bounds Массив из двух объектов LatLng
 */
Filter.prototype.getCars = function(bounds) {
    var cars = {};

    for (let id in this._cars) {
        if (utils.inBounds(this._cars[id].coordinates, bounds)) {
            cars[id] = this._cars[id];
        }
    }

    return cars;
}

module.exports = Filter;
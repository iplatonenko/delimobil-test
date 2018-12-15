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

/**
 * Метод находит новые модели автомобилей, новые автомобили, автомобили по которым произошли изменения
 * 
 * @param {array} cars Массив с объектами автомобилей
 * @param {array} callback Функция, которая будет вызвана по окончанию фильтрации, в которую будут переданы три массива: models, added, updated
 */
Filter.prototype._filter = function(cars, callback) {
    var models = [];
    var added = [];
    var updated = [];
    var removed = [];

    // Ищем автомобили, которые пропали
    let ids_current = Object.keys(this._cars);
    let ids_loaded = cars.map((car) => { return '' + car.id });
    
    ids_current.forEach((id) => {
        if (ids_loaded.indexOf(id) === -1) {
            delete(this._cars[id]);
            removed.push(id);
        }
    });
    
    // Ищем новые модели, автомобили, изменнеия
    for(let i in cars) {
        let car = cars[i];
        car.id = '' + car.id;
        
        // Если нет такой модели - добавляем
        if (!this._models[car.model.name_full]) {
            this._models[car.model.name_full] = car.model;
            models.push(car.model);
        }

        // Видоизменяем структуру данных автомобиля
        car = {
            id: car.id,
            model: car.model.name_full,
            fuel: parseInt(car.fuel),
            coordinates: [car.lat, car.lon]
        }

        // Если такого автомобиля еще нет - добавляем и обрабатываем следующий
        if (!this._cars[car.id]) {
            this._cars[car.id] = car;
            added.push(car);
            continue;
        }

        // Если отличаются объем топлива, широта или долгота - произошло обновление данных 
        if (this._cars[car.id].fuel !== car.fuel || this._cars[car.id].coordinates[0] !== car.coordinates[0] || this._cars[car.id].coordinates[1] !== car.coordinates[1]) {
            // Фиксируем старые координаты, чтобы пройти фильтр при передаче пользователю, если новые координаты за пределами окна
            car.coordinates_old = this._cars[car.id];
            // И заменяем старую запись
            this._cars[car.id] = car;
            updated.push(car);
        }
    }

    callback(models, added, updated, removed);
}

/**
 * Метод запускает обработку новой информации об автомобилях
 * 
 * @param {array} cars Массив с объектами автомобилей
 */
Filter.prototype.update = function(cars) {
    // Ищем добавленные модели, новые автомобили, измененные автомобили, удаленные автомобили
    this._filter(cars, (models, added, updated, removed)=>{
        // И генерируем по каждому типу событие
        this.emit('models', models);
        this.emit('added', added);        
        this.emit('updated', updated);
        this.emit('removed', removed);
    });
}

/**
 * Метод возвращает информацию об известных на данный момент моделях автомобилей
 */
Filter.prototype.getModels = function() {
    return Object.values(this._models);
}

/**
 * Метод возвращает информацию об автомобилях, расположенных в 
 * диапазоне координат верхнего левого и правого нижнего углов
 * 
 * @param {array} bounds Массив из двух объектов LatLng
 */
Filter.prototype.getCars = function(bounds) {
    var cars = [];
    
    for (let id in this._cars) {
        if (utils.inBounds(this._cars[id].coordinates, bounds)) {
            cars.push(this._cars[id]);
        }
    }

    return cars;
}

module.exports = Filter;
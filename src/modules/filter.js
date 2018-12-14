const Events = require('events');

/**
 * Класс отвечает за обработку информации о доступных автомбилях
 */
var Filter = function() {
    this._models = {};
    this._cars = {};
}

Filter.prototype.__proto__ = Events.prototype;

/**
 * Метод проверяет, находится ли автомобиль в заданных координатах
 *
 * @param {number} id Идентификатор автомобиля
 * @param {array} cars Массив с двумя объектами LatLng
 * 
 * @returns {boolean}
 */
Filter.prototype._carInBounds = function(id, bounds) {
    let car = this._cars[id];

}

/**
 * Метод запускает обработку новой информации об автомобилях
 * 
 * @param {array} cars Массив с объектами автомобилей
 */
Filter.prototype.update = function(cars) {
    console.log(cars);
    this._cars = cars;
}

/**
 * Метод возвращает информацию об известных на данный момент моделях автомобилей
 */
Filter.prototype.getModels = function() {
    return this._models;
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
        if (this._carInBounds(id, bounds)) {
            cars.push(this._cars[id]);
        }
    }

    return cars;
}

module.exports = Filter;
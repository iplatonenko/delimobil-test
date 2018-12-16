const 
    Events = require('events'),
    Car = require('./car');

/**
 * Класс отвечает за обработку информации о доступных автомбилях
 */
var Filter = function() {
    this._models = new Map();
    this._cars = new Map();
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

    
    let ids_loaded = cars.map((car) => { 
        return car.id 
    });
    
    // Ищем автомобили, которые пропали
    this._cars.forEach((car, id) => {
        if (!ids_loaded.includes(id)) {
            removed.push(car);
            this._cars.delete(id);
        }
    });
    
    // Ищем новые модели, автомобили, изменения
    cars.forEach((info)=>{

        const car = new Car(info);

        // Проверим, не является ли автомобиль - новой моделью
        if (!this._models.has(car.model)) {
            this._models.set(car.model, info.model);
            models.push(car.model);
        }

        // Проверим, не является ли автомобиль новыми (не присутствующим ранее)
        if (!this._cars.has(car.id)) {
            this._cars.set(car.id, car);
            added.push(car);
            return;
        }

        // Проверим, не обновились ли по автомобилю данные
        if (this._cars.get(car.id).update(car)) {
            updated.push(this._cars.get(car.id));
        }
    })

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
    return Array.from(this._models.values());
}

/**
 * Метод возвращает информацию об автомобилях
 * 
 */
Filter.prototype.getCars = function() {
    return Array.from(this._cars.values());
}

module.exports = Filter;
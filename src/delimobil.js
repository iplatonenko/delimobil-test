const
    http = require('http'),
    static = require('node-static'),
    Api = require('./modules/api'),
    Filter = require('./modules/filter'),
    Connections = require('./modules/connections');

/**
 * Класс сервиса, управляющий модулями получения информации об автомобилях, 
 * её предварительной обработки, модулем связи с пользователями по WebSocket
 * 
 * @param {object} config Объект с конфигурациоными свойствами
 */
var Delimobile = function(config) {
    this._config = config;

    this._api = new Api(this._config.api);
    this._filter = new Filter();
    

    this._static = new static.Server(this._config.public);
    this._server = http.createServer((req, res)=>{
        req.addListener('end', ()=>{
            this._static.serve(req, res);
        }).resume();
    });

    this._connections = new Connections(this._server);

    this._init();
}

/**
 * Метод инициирует подписку на события модулей
 * Выплняется автоматически, при создании экземпляра модуля
 */
Delimobile.prototype._init = function(){
    // При получении новой порции данных по автомобилям
    this._api.on('cars', (cars)=>{
        // Выполняем ее обработку
        this._filter.update(cars);
    });

    // При возникновении новых доступных моделей автомобилей
    this._filter.on('models', (models)=>{
        // Рассылаем о них информацию
        this._connections.sendModels(models);
    });

    // При появлении новых автомобилей
    this._filter.on('added', (cars) => {
        // Рассылаем о них информацию
        this._connections.sendAdded(cars);
    });

    // При обновлении данных об автомобилях
    this._filter.on('updated', (cars) => {
        // Рассылаем информацию об обновлениях
        this._connections.sendUpdated(cars);
    });

    // При пропажи автомобиля из списка
    this._filter.on('removed', (cars) => {
        this._connections.sendRemoved(cars);
    });



    // При установке нового соединения отправляем список моделей
    this._connections.on('connected',(callback)=>{
        // Получаем его
        let models = this._filter.getAllModels();
        // И передаем соединению
        callback(models);
    });

    // При запрсе автомобилей на участке карты
    this._connections.on('bounds', (bounds, callback)=>{
        // Получаем его
        let cars = this._filter.getCars(bounds);
        // И передаем соединению
        callback(cars);
    });
}

Delimobile.prototype.start = function() {
    this._api.startCarsLoop(this._config.loops.cars);
    this._server.listen(this._config.http);
}

module.exports = Delimobile;
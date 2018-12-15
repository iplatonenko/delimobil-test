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

    // Сервис отдачи статики
    this._static = new static.Server(this._config.public);

    // HTTP-сервер
    this._server = http.createServer((req, res)=>{
        req.addListener('end', ()=>{
            this._static.serve(req, res);
        }).resume();
    });

    // Модули сервиса
    this._api = new Api(this._config.api);
    this._filter = new Filter();
    this._connections = new Connections(this._server);

    // Инициализируем подписку на события модулей
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
        if(models.length === 0) {
            return;
        }
        // Рассылаем о них информацию
        this._connections.broadcast('models', models);
    });

    // При появлении новых автомобилей
    this._filter.on('added', (cars) => {
        if(cars.length === 0) {
            return;
        }
        // Рассылаем о них информацию
        this._connections.broadcast('added', cars);
    });

    // При обновлении данных об автомобилях
    this._filter.on('updated', (cars) => {
        if(cars.length === 0) {
            return;
        }
        // Рассылаем информацию об обновлениях
        this._connections.broadcast('updated', cars);
    });

    // При пропажи автомобиля из списка
    this._filter.on('removed', (ids) => {
        if(ids.length === 0) {
            return;
        }
        // Рассылаем информацию об удалениях
        this._connections.broadcast('removed', ids);
    });


    // При установке нового соединения отправляем список моделей
    this._connections.on('connected', (callback)=>{
        // Получаем список моделей авто
        let models = this._filter.getModels();
        // И передаем его соединению
        callback(models);
    });

    // При запросе автомобилей на участке карты
    this._connections.on('load', (bounds, callback)=>{
        // Получаем его
        let cars = this._filter.getCars(bounds);
        // И передаем соединению
        callback(cars);
    });
}

/**
 * Метод запускает основные процессы сервиса:
 *  - прослушивание HTTP и WebSocket запросов
 *  - циклическое получение списка автомобилей
 */
Delimobile.prototype.start = function() {
    this._server.listen(this._config.http);
}

module.exports = Delimobile;
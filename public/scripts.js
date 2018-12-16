
var Delimobil = function(elementId) {
    // Модели автомобилей
    this._models = {};

    // Метки автомобилей на карте
    this._cars = {};

    // Инициализируем карту
    this._map = new ymaps.Map(elementId, {
        center: [55.76, 37.64],
        zoom: 15
    });

    // Инициализируем кластер
    this._cluster =  new ymaps.Clusterer({
        preset: 'islands#darkOrangeClusterIcons',
        groupByCoordinates: false,
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false,
        gridSize: 100
    }),

    // Добавляем кластер на карту
    this._map.geoObjects.add(this._cluster);

    // На каждое изменение видимого диапазона координат (перетаскивание, масштабирование)
    this._map.events.add('actionend', (e) => {
        // вычисляем видимую область
        let bounds = this._map.getBounds();
        // и отправляем на бэкенд информацию о новой доступной области
        this._send('bounds', bounds);
    });


    // WebSocket соединение с бэкендом
    this._ws = new WebSocket('ws://127.0.0.1:8080');

    // При открытии соединения
    this._ws.onopen = () => {
        // вычисляем видимую область
        let bounds = this._map.getBounds();
        // и отправляем на бэкенд информацию о новой доступной области
        this._send('bounds', bounds);
    };

    // При закрытии соединения
    this._ws.onclose = (event) => {
        /**
         * TODO: реакция на обрыв соединения
         */    
    };

    // При ошибке соединения
    this._ws.error  = (error) => {
        /**
         * TODO: реакция на ошибку соединения
         */ 
    }

    // При входящем сообщении
    this._ws.onmessage  = (event) => {
        // Пытаемся его разобрать
        try{
            var message = JSON.parse(event.data);
        } catch(e) {
            console.log('Ошибка парсинга JSON')
            return;
        }
        // И выполнить обработчик 
        switch(message.event) {
            case 'models':
                this._onModels(message.data);
                break;
            case 'loaded':
                this._onLoaded(message.data);
                break;
            case 'added':
                this._onAdded(message.data);
                break;
            case 'updated':
                this._onUpdated(message.data);
                break;
            case 'removed':
                this._onRemoved(message.data);
                break;
            default:
                console.log('Странное сообщение', message.event);
        }
    }
}

/**
 * При добавлении новых моделей
 */
Delimobil.prototype._onModels = function(models) {
    models.forEach((model) => {
        if (this._models[model.name_full]) {
            return;
        }

        this._models[model.name_full] = model;
    });
}

/**
 * По загрузке списка авто
 */
Delimobil.prototype._onLoaded = function(cars) {
    // Сначала добавляем новые автомобили
    this._onAdded(cars);

    // Потом удаляем те, которые остались, но их нет в текущей зарузке
    var ids_loaded = cars.map((car) => { return '' + car.id });
    var ids_current =  Object.keys(this._cars);
    
    ids_current.forEach((id)=>{
        if (ids_loaded.indexOf(id) === -1) {
            this._removeCar(id);
        }
    });
}

/**
 * При добалении новых авто
 */
Delimobil.prototype._onAdded = function(cars) {
    cars.forEach((car) => {
        if (this._cars[car.id]) {
            return;
        }
        this._addCar(car);
    });
}

/**
 * При изменении информации об авто
 */
Delimobil.prototype._onUpdated = function(cars) {
    cars.forEach((car) => {
        if (!this._cars[car.id]) {
            return;
        }

        this._updateCar(car);
    });
}

/**
 * При удалении авто
 */
Delimobil.prototype._onRemoved = function(ids) {
    ids.forEach((car)=>{
        if (!this._cars[car.id]) {
            return;
        }

        this._removeCar(car.id);
    });
}


/**
 * Метод отправляет в WebSocket данные
 * 
 * @param {string} event Название события
 * @param {any} data Данные для соответствующего события
 */
Delimobil.prototype._send = function(event, data) {
    if (this._ws.readyState !== 1) {
        return;
    }

    let message = {
        event: event,
        data: data
    }
    this._ws.send(JSON.stringify(message));
}

/**
 * Метод добавляем на карту отметку о новом автомобиле
 * 
 * @param {object} info Информация об автомобиле
 */
Delimobil.prototype._addCar = function(info) {
    var model = this._models[info.model];

    var carPlacemark = new ymaps.Placemark(info.coordinates, {
        balloonContentHeader: model.name,
        balloonContentBody: 'Характеристики: ' + model.engine_power + ' л.с. (' + model.engine_capacity + 'л), ' + model.transmission + ', ' + model.year + '<br><img class="placemarc-car__img" src="img/' + model.name + ' Big.png">',
        balloonContentFooter: 'Запас топлива: ' + info.fuel
    }, {
        iconLayout: 'default#image',
        iconImageHref: 'img/' + model.name + '.png',
        iconImageSize: [48, 48],
        iconImageOffset: [-24, -24],
        
    });
    this._cars[info.id] = carPlacemark;
    this._cluster.add(carPlacemark);
}

/**
 * Метод метод изменяет метку с информацией об автомобиле
 * 
 * @param {object} info Информация об автомобиле
 */
Delimobil.prototype._updateCar = function(info) {
    this._cars[info.id].geometry.setCoordinates(info.coordinates);
    this._cars[info.id].properties.set('balloonContentFooter', info.fuel);
}

/**
 * Метод удаляет метку
 * 
 * @param {number} id Идентификатор автомобиля
 */
Delimobil.prototype._removeCar = function(id) {
    this._cluster.remove(this._cars[id]);
    delete(this._cars[id]);
}




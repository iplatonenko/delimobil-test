var Car = function(info, model) {
    this._info = info;
    this._model = model;
    this.placemark = new ymaps.Placemark(this._info.coordinates, {
        balloonContentBody: '<h3>' + this._model.name + '</h3><h5>Двигатель: ' + model.engine_power + ' л.с. (' + model.engine_capacity + 'л) Коробка' + model.transmission+'</h5><h5>Год выпуска: ' + model.year + '</h5><img src="img/' + this._model.name + ' Big.png"><p>Запас топлива: ' + this._info.fuel + '%</p>'
    }, {
        iconLayout: 'default#image',
        iconImageHref: 'img/' + this._model.name + '.png',
        iconImageSize: [63, 26],
        iconImageOffset: [-32, -23],
        
    }); 
}

Car.prototype.update = function(info) {
    this._info = info;
}

Car.prototype.remove = function() {
    
}

var Delimobil = function(elementId) {
    this._cars = {};
    this._models = {};

    this._map = new ymaps.Map(elementId, {
        center: [55.76, 37.64],
        zoom: 15
    });

    this._cluster =  new ymaps.Clusterer({
        preset: 'islands#darkOrangeClusterIcons',
        groupByCoordinates: false,
        clusterDisableClickZoom: false,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false,
        gridSize: 100
    },{
        
    }),

    this._map.geoObjects.add(this._cluster);

    this._map.events.add('actionend', (e) => {
        let bounds = this._map.getBounds();
        this._send('bounds', bounds);
    });

    

    this._ws = new WebSocket('ws://127.0.0.1:8080');
    
    this._ws.onopen = () => {
        console.log("Соединение установлено.");
        let bounds = this._map.getBounds();
        this._send('bounds', bounds);
    };

    
      
    this._ws.onclose = function(event) {
        if (event.wasClean) {
            console.log('Соединение закрыто чисто');
        } else {
            console.log('Обрыв соединения');
        }
    };

    this._ws.onmessage  = (event) => {
        try{
            var message = JSON.parse(event.data);
        } catch(e) {
            console.log('Ошибка парсинга JSON')
            return;
        }
        this._onEvent(message.event, message.data);
    }

    this._ws.error  = (error) => {
        console.log(error);
    }
}

Delimobil.prototype._onEvent = function(event, data) {
    if (event === 'models') {
        for(let id in data) {
            if (this._models[id]) {
                continue;
            }
            this._models[id] = data[id];
        }
        return;
    }

    if (event === 'loaded') {
        for(let id in data) {
            if (this._cars[id]) {
                continue;
            }
            this._cars[id] = new Car(data[id], this._models[data[id].model]);
            this._cluster.add(this._cars[id].placemark);
        }
        return;
    }

    if (event === 'added') {
        for(let id in data) {
            this._cars[id] = new Car(data[id], this._models[data[id].model]);
            this._cluster.add(this._cars[id].placemark);
        }
        return;
    }

    if (event === 'updated') {
        for(let id in data) {
            if (!this._cars[id]) {
                continue;
            }

            this._cars[id].update(data[id]);
        }
        return
    }

    if (event === 'removed') {
        for(let i in data) {
            if (!this._cars[data[i]]) {
                continue;
            }
            this._cluster.remove(this._cars[data[i]].placemark);
            delete(this._cars[data[i]]);
        }
    }
}

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


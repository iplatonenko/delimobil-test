const 
    Delimobil = require('./delimobil'),
    config = require('../config');

let delimobil = new Delimobil(config);
delimobil.start();
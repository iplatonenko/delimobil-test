var Car = function(info){
    this.id= info.id;
    this.fuel = info.fuel;
    this.model = info.model.name_full;
    this.coordinates = [info.lat, info.lon];
}

Car.prototype.update = function(car) {
    let updated = false;
    if (car.fuel !== this.fuel || car.coordinates[0] !== this.coordinates[0] || car.coordinates[1] !== this.coordinates[1]) {
        this.fuel = car.fuel;
        this.coordinates_old = this.coordinates;
        this.coordinates = car.coordinates;
        updated = true;
    }

    return updated;
}

Car.prototype.inBounds = function(bounds, old) {
    if (!bounds) {
        return;
    }

    let coordinates = old ? this.coordinates_old : this.coordinates;

    if (coordinates[0] > bounds[0][0] && coordinates[0] < bounds[1][0] && coordinates[1] > bounds[0][1] && coordinates[1] < bounds[1][1]) {
        return true;
    }

    return false;
}

module.exports = Car;
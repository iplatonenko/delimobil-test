/**
 * Функция проверяет вхождение координат в прямоугольную четырехугольник
 */
module.exports.inBounds = function(coordinates, bounds) {
    if (!bounds) {
        return;
    }
    if (coordinates[0] > bounds[0][0] && coordinates[0] < bounds[1][0] && coordinates[1] > bounds[0][1] && coordinates[1] < bounds[1][1]) {
        return true;
    }
    return false;
}
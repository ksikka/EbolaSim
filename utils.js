/* Methods to sample fancy distributions */
var sampleNormal = function(mean, std) {
    return Math.random() * std + mean;
};
var sampleGeom = function(p) {
    var i = 0, x;
    while ((x = Math.random()) > p)
        i ++;
    return i;
};


/* Enum for state types, which may also be used as event types. */
var E = {
    HEALTHY: 0,
    EXPOSE: 1,
    INFECT: 2,
    SYMPTOM: 3,
    DEATH: 4,
    HOSPITAL: 5,
    RECOVER: 6,
};

var COLORMAP = {};
COLORMAP[E.HEALTHY] = 'white';
COLORMAP[E.EXPOSE] = 'yellow';
COLORMAP[E.INFECT] = 'orange';
COLORMAP[E.SYMPTOM] = '#8C001A';
COLORMAP[E.DEATH] = 'black';
COLORMAP[E.HOSPITAL] = 'blue';
COLORMAP[E.RECOVER] = 'pink';


/* Methods to sample fancy distributions */

var sampleUniform = function(min, max) {
    return (Math.random() * (max-min) + min);
};
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
    INFECT: 2,
    SYMPTOM: 3,
    DEATH: 4,
    HOSPITAL: 5,
    RECOVER: 6,
};


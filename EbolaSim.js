/* Simulation code */

/* Probability distributions for events */
var BURY_TIME = 1 * 24; // 1 day
var sampleTimeToSymptomatic = function() {
    // Uniform dist from 2 to 21 days
    return (Math.random() * (21-2) + 2) * 24;
};
var sampleTimeToInfection = function() {
    // 1.5 days
    var avgTimeBetweenContacts = Math.random() * 6 * 24;
    var contactsTillTransmission = sampleGeom(1/4);
    return contactsTillTransmission * avgTimeBetweenContacts;
};
var sampleTimeToHospital = function() {
    // 3.24 days, with a variance of 2.
    return sampleNormal(3.24,Math.pow(2,2)) * 24;
};
var sampleTimeToRecover = function() {
    // 15.88 days
    // note that this is from hospital to recovery.
    return sampleNormal(15.88, Math.pow(4,2)) * 24;
};
var sampleTimeToDeath = function() {
    // 6.26 - 10.07 days
    // note that this is from hospital to death.
    return sampleNormal((6.26+10.07)/2, Math.pow(4,2)) * 24;
};

var Simulation = function (m,n) {
    this.m = m;
    this.n = n;
    this.eventQueue = [];

    // m x n of healthy
    this.states = _.map(_.range(m), function() {
        return _.map(_.range(n), function() {
            return E.HEALTHY;
        });
    });

    this.stateCount = {};
    this.stateCount[E.HEALTHY] = m * n;
    this.stateCount[E.EXPOSE] = 0;
    this.stateCount[E.INFECT] = 0;
    this.stateCount[E.SYMPTOM] = 0;
    this.stateCount[E.DEATH] = 0;
    this.stateCount[E.HOSPITAL] = 0;
    this.stateCount[E.RECOVER] = 0;

    this.eventHistory = [];
};

/* Proxy to change the state of the simulation. */
Simulation.prototype.set = function(e) {
    // update states and state count
    var oldState = this.states[e.i][e.j];
    this.states[e.i][e.j] = e.type;

    this.stateCount[oldState] --;
    this.stateCount[e.type] ++;

    // For convenience in updating the UI, copy oldState to the event.
    e.oldState = oldState;

    // Store the info to be displayed on the UI later.
    var stateCount = _.clone(this.stateCount);
    this.eventHistory.push([e, stateCount]);
};

Simulation.prototype.invalidateAllEvents = function(i,j) {
    if (_.isEmpty(this.eventQueue))
        return null;
    var oldLen = this.eventQueue.length;
    this.eventQueue = _.reject(this.eventQueue, function(e) {
        return (i == e.i) && (j == e.j);
    });
    return oldLen - this.eventQueue.length;
};

Simulation.prototype.getNextEvent = function(i,t) {
    if (_.isEmpty(this.eventQueue))
        return null;
    var nextEvent =  _.min(this.eventQueue, function(e) {return e.t;});
    this.eventQueue = _.without(this.eventQueue, nextEvent);
    return nextEvent;
};

Simulation.prototype.withinBounds = function(i,j) {
    return (0 <= i && i < this.m) && (0 <= j && j < this.n);
};

Simulation.prototype.getNeighbors = function(i,j) {
    var nbrs = [];
    var self = this;
    var nbrs = _.filter([[i-1,j-1],[i-1,j],[i-1,j+1],
                         [i  ,j-1],       ,[i  ,j+1],
                         [i+1,j-1],[i+1,j],[i+1,j+1]],
                         function(x) { return self.withinBounds(x[0],x[1]); });
    return nbrs;
};

Simulation.prototype.processEvent = function(e) {
    this.set(e);
    this.t = e.t;
    var self = this;

    switch (e.type) {
        case E.INFECT:
            /* invalidate all events on i,j
             * sample time till Symptomatic */
            this.invalidateAllEvents()
            var t_s = sampleTimeToSymptomatic();
            this.eventQueue.push({i: e.i, j: e.j, type: E.SYMPTOM, t: e.t + t_s});
            break;
        case E.SYMPTOM:
            /* sample time till Hospital
               sample time till Death directly prop to time till hosp
               sample time till Recover inverse prop to time till hosp */
            var t_h = sampleTimeToHospital();

            this.eventQueue.push({i: e.i, j: e.j, type: E.HOSPITAL, t: e.t + t_h});

            /* Change state of healthy neighbors to exposed */
            var healthyNbrs = _.filter(this.getNeighbors(e.i,e.j), function(x) {return self.states[x[0]][x[1]] == E.HEALTHY });
            _.each(healthyNbrs, function(x) {
                var i = x[0], j = x[1];
                self.set({i:i,j:j,type:E.EXPOSE, t:e.t});
            })

            /* for all exposed neighbors, sample time till infected.
             * generate infected events for each exposed neighbor if t < min(time to hospital, time to recover, time to death + BURY_TIME) . */
            _.each(healthyNbrs, function(x) {
                var t_infect = sampleTimeToInfection();
                if (t_infect < t_h) {
                    self.eventQueue.push({i:x[0],j:x[1],type:E.INFECT,t:e.t + t_infect});
                }
            })
            break;
        case E.HOSPITAL:
            var t_r = sampleTimeToRecover();
            var t_d = sampleTimeToDeath();
            /* if time to recover < time to death, gen recover event, else gen death event */
            if (t_r < t_d)
                this.eventQueue.push({i: e.i, j: e.j, type: E.RECOVER, t: e.t + t_r});
            else
                this.eventQueue.push({i: e.i, j: e.j, type: E.DEATH, t: e.t + t_d});

            // TODO generation infect events in hospital.

            break;
        case E.RECOVER:
            break;
        case E.DEATH:
            break;
        default:
            alert('no');
    }
}

Simulation.prototype.runEventLoop = function(maxT) {
    var e;
    this.t = 0;
    while (this.t < maxT && (e = this.getNextEvent())) {
        this.processEvent(e);
    }
}

Simulation.prototype.simulate = function() {

    /* Start off by infecting one person */
    var i0 = Math.floor(this.m/2);
    var j0 = Math.floor(this.n/2);
    this.eventQueue.push({i:i0, j:j0, type: E.INFECT, t:0});

    /* Run Event Loop Until Max T (2 years for now) */
    this.runEventLoop(2*365*24);


};

Simulation.prototype.exportCSV = function () {
    var csvLines = [];
    csvLines.push('time	healthy	exposed	infected	symptomatic	hospitalized	recovered	dead');

    // copies then reverses
    var reversedHistory = this.eventHistory.slice();
    reversedHistory.reverse();

    _.each(reversedHistory, function(eh) {
        var stateCount = eh[1];
        csvLines.push([eh[0].t,
                       stateCount[E.HEALTHY],
                       stateCount[E.EXPOSE],
                       stateCount[E.INFECT],
                       stateCount[E.SYMPTOM],
                       stateCount[E.HOSPITAL],
                       stateCount[E.RECOVER],
                       stateCount[E.DEATH]].join('\t'));
    });

    return csvLines.join('\n');
}

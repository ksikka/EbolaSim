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
    // 2.5 days, with a variance of 2.
    return sampleNormal(2.5,Math.pow(2,2)) * 24;
};
var sampleTimeToRecover = function() {
    // 12 - 16 days
    return sampleNormal(14, Math.pow(2,2)) * 24;
};
var sampleTimeToDeath = function() {
    // 10 - 14 days
    return sampleNormal(12, Math.pow(2,2)) * 24;
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
    })

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

    // Store the info to be displayed on the UI later.
    var stateCount = _.clone(this.stateCount);
    this.eventHistory.push([e, stateCount]);
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
            var t_s = sampleTimeToSymptomatic();
            this.eventQueue.push({i: e.i, j: e.j, type: E.SYMPTOM, t: e.t + t_s});
            break;
        case E.SYMPTOM:
            /* sample time till Hospital
               sample time till Death directly prop to time till hosp
               sample time till Recover inverse prop to time till hosp */
            var t_h = sampleTimeToHospital();
            var t_d = sampleTimeToDeath();
            var t_r = sampleTimeToRecover();
            /* if time to recover < time to death, gen recover event, else gen death event */
            if (t_r < t_d)
                this.eventQueue.push({i: e.i, j: e.j, type: E.RECOVER, t: e.t + t_r});
            else
                this.eventQueue.push({i: e.i, j: e.j, type: E.DEATH, t: e.t + t_d});

            /* if time to hospital < min(time to recover, time to die), gen hospital event. */
            if (t_h < Math.min(t_r, t_d))
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
                if (t_infect < Math.min(t_h, t_r, t_d + BURY_TIME)) {
                    self.eventQueue.push({i:x[0],j:x[1],type:E.INFECT,t:e.t + t_infect});
                }
            })
            break;
        case E.DEATH:
            break;
        case E.HOSPITAL:
            // TODO generation infect events in hospital.
            break;
        case E.RECOVER:
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

Simulation.prototype.show = function(el) {
    this.simview = new SimView({el:el, m:this.m, n:this.n});
    this.simview.render();

    this.simview.setData(this.eventHistory);

    var self = this;
    _.each(this.eventHistory, function(eh) {
        var e = eh[0], stateCount = eh[1];
        window.setTimeout(function() {
            self.simview.updateToState(e,stateCount);
        }, e.t * 25);
    });
};

/* Simulation code */

var hasHospital = true;

/* Probability distributions for events */
var INCUBATION_MIN = 2;
var INCUBATION_MAX = 21;

var COMM_CONTACT_PERIOD_MIN = 0.5;
var COMM_CONTACT_PERIOD_MAX = 5;
var COMM_TRANS_PR = 0.15;

var HCWASSIGNED = 2; // assign 2 hcw to a patient
var HOSP_TRANS_PR = 0.05;
var HOSP_CONTACT_PERIOD = 2;

// FROM PAPER
var MEAN_TIME_TO_HOSP = 3.24;
var STDEV_TIME_TO_HOSP = 1;

var STDEV = 6;
// FROM PAPER
// note that this is from infection to recovery.
var MEAN_TIME_TO_RECOVER = (15+20)/2;
var STDEV_TIME_TO_RECOVER = STDEV;

var MEAN_TIME_TO_DEATH = 13.35;
var STDEV_TIME_TO_DEATH = STDEV;

// note that this is from hosp to recovery.
var MEAN_TIME_TO_HOSPRECOVER = 15.88;
var STDEV_TIME_TO_HOSPRECOVER = STDEV;

var MEAN_TIME_TO_HOSPDEATH = (6.26+10.07)/2;
var STDEV_TIME_TO_HOSPDEATH = STDEV;

var sampleTimeToSymptomatic = function() {
    // Uniform dist from 2 to 21 days
    return sampleUniform(INCUBATION_MIN*24, INCUBATION_MAX*24);
};
var sampleTimeToInfection = function() {
    // similar to the attack rate. smaller time is stronger attack rate.
    // intimate contact once every 2-6 days, 1/10th chance of transmission, these are completely made up params.
    var avgTimeBetweenContacts = sampleUniform(COMM_CONTACT_PERIOD_MIN*24, COMM_CONTACT_PERIOD_MAX*24);
    var contactsTillTransmission = sampleGeom(COMM_TRANS_PR);
    return contactsTillTransmission * avgTimeBetweenContacts;
};
var sampleTimeToInfectionHC = function() {
    // for a healthcare worker
    var avgTimeBetweenContacts = HOSP_CONTACT_PERIOD * 24;
    var contactsTillTransmission = sampleGeom(HOSP_TRANS_PR);
    return contactsTillTransmission * avgTimeBetweenContacts;
};
var sampleTimeToHospital = function() {
    return sampleNormal(MEAN_TIME_TO_HOSP, STDEV_TIME_TO_HOSP) * 24;
};
var sampleTimeToRecover = function() {
    return sampleNormal(MEAN_TIME_TO_RECOVER, STDEV_TIME_TO_RECOVER) * 24;
};
var sampleTimeToDeath = function() {
    return sampleNormal(MEAN_TIME_TO_DEATH, STDEV_TIME_TO_DEATH) * 24;
};
var sampleTimeToHospRecover = function() {
    return sampleNormal(MEAN_TIME_TO_HOSPRECOVER, STDEV_TIME_TO_HOSPRECOVER) * 24;
};
var sampleTimeToHospDeath = function() {
    return sampleNormal(MEAN_TIME_TO_HOSPDEATH, STDEV_TIME_TO_HOSPDEATH) * 24;
};

var Simulation = function (m,n) {
    this.m = m;
    this.n = n;
    this.eventQueue = [];

    // (m+1) x n of healthy
    // represents an augmented matrix
    // where first m rows is community
    // and last row is hospital
    this.states = _.map(_.range(m+1), function () {
        return _.map(_.range(n), function () {
            return E.HEALTHY;
        });
    });

    this.stateCount = {};
    this.stateCount[E.HEALTHY] = m * n;
    this.stateCount[E.INFECT] = 0;
    this.stateCount[E.SYMPTOM] = 0;
    this.stateCount[E.DEATH] = 0;
    this.stateCount[E.HOSPITAL] = 0;
    this.stateCount[E.RECOVER] = 0;

    // counts for healthcare workers.
    this.hospStateCount = {};
    this.hospStateCount[E.HEALTHY] = n;
    this.hospStateCount[E.INFECT] = 0;
    this.hospStateCount[E.SYMPTOM] = 0;
    this.hospStateCount[E.DEATH] = 0;
    this.hospStateCount[E.HOSPITAL] = 0;
    this.hospStateCount[E.RECOVER] = 0;

    this.eventHistory = [];
};

/* Proxy to change the state of the simulation. */
Simulation.prototype.set = function(e) {
    // update states and state count
    var oldState = this.states[e.i][e.j];
    this.states[e.i][e.j] = e.type;

    if (this.isHCW(e.i)) {
        this.hospStateCount[oldState] --;
        this.hospStateCount[e.type] ++;
    } else {
        this.stateCount[oldState] --;
        this.stateCount[e.type] ++;
    }

    // For convenience in updating the UI, copy oldState to the event.
    e.oldState = oldState;

    // Store the info to be displayed on the UI later.
    var stateCount = _.clone(this.stateCount);
    var hospStateCount = _.clone(this.hospStateCount);
    this.eventHistory.push([e, stateCount, hospStateCount]);
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
    // NOTE that HCWs are not within bounds. this function is only to be used for normal people.
    return (0 <= i && i < this.m) && (0 <= j && j < this.n);
};

Simulation.prototype.isHCW = function(i) {
    return (i === this.m);
};

Simulation.prototype.getNeighbors = function(i,j) {
    // HCW is not spatial.
    if (this.isHCW(i)) {
        alert('no');
        throw 'a fit';
    }
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
            this.invalidateAllEvents(e.i, e.j);
            var t_s = sampleTimeToSymptomatic();
            this.eventQueue.push({i: e.i, j: e.j, type: E.SYMPTOM, t: e.t + t_s});
            break;

        case E.SYMPTOM:
            /* sample time till Hospital
               sample time till Death directly prop to time till hosp
               sample time till Recover inverse prop to time till hosp */

            // (if healthcare then they go to hosp immediately, and you're done with this case.)
            var t_h = sampleTimeToHospital();
            if (this.isHCW(e.i)) {
                this.eventQueue.push({i: e.i, j: e.j, type: E.HOSPITAL, t: e.t});
                break;
            }
            // Since we broke in the HCW case, now the person is guaranteed to be in the community only.

            if (hasHospital) {
                this.eventQueue.push({i: e.i, j: e.j, type: E.HOSPITAL, t: e.t + t_h});
            }

            var healthyNbrs = _.filter(this.getNeighbors(e.i,e.j), function(x) {
                return (self.states[x[0]][x[1]] === E.HEALTHY);
            });
            _.each(healthyNbrs, function(x) {
                var i = x[0], j = x[1];

                /* for all exposed neighbors, sample time till infected.
                 * generate infected events for each exposed neighbor. */
                var t_infect = sampleTimeToInfection();
                if (t_infect < t_h) {
                    self.eventQueue.push({i:i,j:j,type:E.INFECT,t:e.t + t_infect});
                }
            })

            var t_r = sampleTimeToRecover();
            var t_d = sampleTimeToDeath();
            /* if time to recover < time to death, gen recover event, else gen death event */
            if (t_r < t_d)
                this.eventQueue.push({i: e.i, j: e.j, type: E.RECOVER, t: e.t + t_r});
            else
                this.eventQueue.push({i: e.i, j: e.j, type: E.DEATH, t: e.t + t_d});

            break;

        case E.HOSPITAL:
            var t_r = sampleTimeToHospRecover();
            var t_d = sampleTimeToHospDeath();
            /* if time to recover < time to death, gen recover event, else gen death event */
            if (t_r < t_d)
                this.eventQueue.push({i: e.i, j: e.j, type: E.RECOVER, t: e.t + t_r});
            else
                this.eventQueue.push({i: e.i, j: e.j, type: E.DEATH, t: e.t + t_d});

            var assignedHCWorkers = _.sample( _.filter(_.range(this.n), function(i) {
                return (self.states[self.m][i] === E.HEALTHY);
            }), HCWASSIGNED);
            _.each(assignedHCWorkers, function(j) {
                var i = self.m
                var t_i = sampleTimeToInfectionHC();
                if (t_i < Math.min(t_r, t_d)) {
                    // Infect the ith healthcare worker.
                    self.eventQueue.push({i:i,j:j,type:E.INFECT,t:e.t + t_i});
                }
            });

            break;

        case E.RECOVER:
            this.invalidateAllEvents(e.i, e.j);
            break;
        case E.DEATH:
            this.invalidateAllEvents(e.i, e.j);
            break;
        default:
            alert('no');
    }
};

Simulation.prototype.runEventLoop = function(maxT) {
    var e;
    this.t = 0;
    while (this.t < maxT && (e = this.getNextEvent())) {
        this.processEvent(e);
    }
};

Simulation.prototype.simulate = function() {

    /* Start off by infecting one person */
    var i0 = Math.floor(this.m/2);
    var j0 = Math.floor(this.n/2);
    this.eventQueue.push({i:i0, j:j0, type: E.INFECT, t:0});

    /* Run Event Loop Until Max T (2 years for now) */
    this.runEventLoop(2*365*24);


};

Simulation.prototype.exportCSV = function () {
    // TODO update with healthcare data.
    var csvLines = [];
    csvLines.push('time	s	e	i	r	h	f	s_h	e_h	i_h	r_h	h_h	f_h');

    // copies then reverses
    var reversedHistory = this.eventHistory.slice();
    reversedHistory.reverse();

    _.each(reversedHistory, function(eh) {
        var stateCount = eh[1], hospStateCount = eh[2];
        csvLines.push([eh[0].t,
                       stateCount[E.HEALTHY],
                       stateCount[E.INFECT],
                       stateCount[E.SYMPTOM],
                       stateCount[E.RECOVER],
                       stateCount[E.HOSPITAL],
                       stateCount[E.DEATH], 
                       hospStateCount[E.HEALTHY],
                       hospStateCount[E.INFECT],
                       hospStateCount[E.SYMPTOM],
                       hospStateCount[E.RECOVER],
                       hospStateCount[E.HOSPITAL],
                       hospStateCount[E.DEATH], 
        ].join('\t'));
    });

    return csvLines.join('\n');
}



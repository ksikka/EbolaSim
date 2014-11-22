var sampleTimeToSymptomatic = function() {
    // Uniform dist from 2 to 21 days
    return Math.random() * 21 + 2;
};

var LatticeView = Backbone.View.extend({

    initialize: function(opts) {
        this.m = opts.m;
        this.n = opts.n;
    },

    changeColor: function(i,j,color) {
        this.$('tr:nth-child('+(i+1)+') td:nth-child('+(j+1)+')').css('background-color',color);
    },

    drawGrid: function() {
        var $t = $('<table></table>');
        var self = this;
        _.times(self.m, function(i) {
            $r = $('<tr></tr>')
            _.times(self.n, function(j) {
                $('<td></td>').appendTo($r);
            });
            $r.appendTo($t);
        });
        this.$el.append($t);
    },

    render: function() {
        this.$el.html('');
        this.$el.addClass('simulation-lattice');
        this.drawGrid();
        return this;
    }
});

var SimView = Backbone.View.extend({

    initialize: function(opts) {
        this.m = opts.m;
        this.n = opts.n;
    },

    render: function() {
        this.$el.html('');
        this.$el.append('<div id="lattice"></div>');
        if (!this.lv)
            this.lv = new LatticeView({
                el:this.$('#lattice'),
                m:this.m,
                n:this.n
            });
        this.lv.render();
        return this;
    },
});

/* Enum for state types, which may also be used as event types. */
var E = {
    HEALTHY: 0,
    EXPOSE: 1,
    INFECT: 2,
    SYMPTOM: 3,
    DEATH: 4,
    HOSPITAL: 5,
    RECOVERED: 6,
};

var COLORMAP = {};
COLORMAP[E.HEALTHY] = 'white';
COLORMAP[E.EXPOSE] = 'yellow';
COLORMAP[E.INFECT] = 'red';
COLORMAP[E.SYMPTOM] = '#8C001A';
COLORMAP[E.DEATH] = 'black';
COLORMAP[E.RECOVERED] = 'blue';

var Simulation = function (m,n,el) {
    this.m = m;
    this.n = n;
    this.simview = new SimView({el:el, m:m, n:n});
    this.eventQueue = [];
    // m x n of healthy
    this.states = _.map(_.range(m), function() {
        return _.map(_.range(n), function() {
            return E.HEALTHY;
        });
    })
};

Simulation.prototype.set = function(i,j,state) {
    this.states[i][j] = state;
    this.simview.lv.changeColor(i,j,COLORMAP[state])
};

Simulation.prototype.start = function() {
    this.simview.render();

    /* Start off by infecting one person */
    var i0 = Math.floor(this.m/2);
    var j0 = Math.floor(this.n/2);
    this.eventQueue.push({i:i0, j:j0, type: E.INFECT, t:0});

    /* Run Event Loop Until Max T (2 years for now) */
    this.runEventLoop(2*365*24);

};

Simulation.prototype.getNextEvent = function(i,t) {
    if (_.isEmpty(this.eventQueue))
        return null;
    var nextEvent =  _.min(this.eventQueue, function(e) {return e.t;});
    this.eventQueue = _.without(this.eventQueue, nextEvent);
    return nextEvent;
};

Simulation.prototype.processEvent = function(e) {
    this.set(e.i, e.j, e.type);
    this.t = e.t;

    switch (e.type) {
        case E.INFECT:
            /* invalidate all events on i,j
             * sample time till Symptomatic */
            var t_s = sampleTimeToSymptomatic();
            this.eventQueue.push({i: e.i, j: e.j, type: E.SYMPTOM, t: e.t + t_s});
            break;
        case E.SYMPTOM:
            /* sample time till Hospital
            /* sample time till Death directly prop to time till hosp
            /* sample time till Recover inverse prop to time till hosp
             * if time to recover < time to death, gen recover event, else gen death event
             * if time to hospital < min(time to recover, time to die), gen hospital event.
            /* Change state of healthy neighbors to exposed */
            /* for all exposed neighbors, sample time till infected.
             * generate infected events for each exposed neighbor if t < min(time to hospital, time to recover, time to death + BURY_TIME) . */
            break;
        case E.DEATH:
            break;
        case E.HOSPITAL:
            // TODO generation infect events in hospital.
            break;
        case E.RECOVERED:
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



/* UI Code */
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
            $r = $('<tr></tr>');
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

    events: {
        "input .timeslider": "onTimeSliderChange"
    },

    setData: function(eventHistory) {
        if (eventHistory.length === 0)
            alert('Empty simulation.')

        this.eventHistory = eventHistory;
        this.curI = 0;

        var mint = 0;
        var maxt = eventHistory[eventHistory.length - 1][0].t;
        this.$('.timeslider').attr('min', mint);
        this.$('.timeslider').attr('max', maxt);
        this.$('.timeslider').attr('step', 1);

        this.update();
        this.updateStateToTime(0);
    },

    onTimeSliderChange: function(e) {
        var time = $(e.target).val();
        //this.updateStateToTime(time);
    },

    updateStateToTime: function(t) {
        /* Update to the last event where time = t. */
        var curT = Math.floor(this.eventHistory[this.curI][0].t);
        var curI = this.curI

        var doneThisBefore = false;
        var lastWasLeft = null;

        // search for the time. either you found it, hit a boundary, or you missed it.
        // TODO implement MOVELEFT and MOVERIGHT
        while (t != curT) {
            if (t < curT) {
                if (curI <= 0) break;
                if (doneThisBefore && !lastWasLeft) break;
                curI --;
                lastWasLeft = true;
            } else {
                if (curI >= this.eventHistory.length - 1) break;
                if (doneThisBefore && lastWasLeft) break;
                curI ++;
                lastWasLeft = false;
                //this.applyEvent(this.eventHistory.currentEvent);
            }
            curT = this.eventHistory[curI][0].t;
            doneThisBefore = true;
            this.curI = curI;
        }


    },

    update: function() {
        var eh = this.eventHistory[this.curI];
        var e = eh[0], stateCount = eh[1];
        this.updateToState(e, stateCount);
    },

    updateToState: function(e, stateCount) {
        this.plv.changeColor(e.i, e.j, COLORMAP[e.type])
        this.updateTimeView(e.t);
        this.updateStateCountView(stateCount);
    },

    updateTimeView: function(t) {
        this.$('.timeslider').attr('value', t);
        // t is number of hours
        var days = Math.floor(t/24);
        var hours = Math.floor(t - days*24);
        this.$('.timeview').html('Time: ' + days + ' days and ' + hours + ' hours.');
        this.$('.timeslider').attr('value', Math.floor(t));
    },

    updateStateCountView: function(stateCount) {
        this.$('.statecountview').html('');
        var $t = $('<table>'), $tr;
        $tr = $('<tr></tr>').appendTo($t);
        $tr.append('<td>Healthy:</td><td>'+stateCount[E.HEALTHY]+'</td>');
        $tr = $('<tr></tr>').appendTo($t);
        $tr.append('<td>Exposed:</td><td>'+stateCount[E.EXPOSE]+'</td>');
        $tr = $('<tr></tr>').appendTo($t);
        $tr.append('<td>Infected:</td><td>'+stateCount[E.INFECT]+'</td>');
        $tr = $('<tr></tr>').appendTo($t);
        $tr.append('<td>Symptomatic:</td><td>'+stateCount[E.SYMPTOM]+'</td>');
        $tr = $('<tr></tr>').appendTo($t);
        $tr.append('<td>Hospitalized:</td><td>'+stateCount[E.HOSPITAL]+'</td>');
        $tr = $('<tr></tr>').appendTo($t);
        $tr.append('<td>Dead:</td><td>'+stateCount[E.DEATH]+'</td>');
        $tr = $('<tr></tr>').appendTo($t);
        $tr.append('<td>Recovered:</td><td>'+stateCount[E.RECOVER]+'</td>');

        this.$('.statecountview').append($t);
    },

    render: function() {
        if (!this.hlv)
            this.hlv = new LatticeView({ el:this.$('.hosp-lattice'), m:2, n:this.n });
        if (!this.plv)
            this.plv = new LatticeView({ el:this.$('.pop-lattice'), m:this.m, n:this.n });
        this.plv.render();
        this.hlv.render();

        /*
        this.$el.append('<div class="controls"></div>');
        if (!this.cv)
            this.cv = new ControlsView();
        this.cv.render();
        */

        return this;
    },
});

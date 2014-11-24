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

    update: function(e, stateCount) {
        this.lv.changeColor(e.i,e.j,COLORMAP[e.type])
        this.updateTimeView(e.t);
        this.updateStateCountView(stateCount);
    },

    updateTimeView: function(t) {
        // t is number of hours
        var days = Math.floor(t/24);
        var hours = Math.floor(t - days*24);
        this.$('.timeview').html('Time: ' + days + ' days and ' + hours + ' hours.');
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
        this.$el.html('');

        this.$el.append('<h2>Population</h2>');
        this.$el.append('<div class="lattice"></div>');
        if (!this.lv)
            this.lv = new LatticeView({ el:this.$('.lattice'), m:this.m, n:this.n });
        this.lv.render();

        /*
        this.$el.append('<div class="controls"></div>');
        if (!this.cv)
            this.cv = new ControlsView();
        this.cv.render();
        */


        this.$el.append('<div class="timeview"></div>');
        this.$el.append('<div class="statecountview"></div>');
        return this;
    },
});

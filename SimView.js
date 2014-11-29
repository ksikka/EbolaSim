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
                $('<td>&nbsp;</td>').appendTo($r);
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
        "click .play-alt": "clickPlay"
    },

    clickPlay: function() {
        alert('yo');
    },

    updateTimeView: function(t) {
        // t is number of hours
        var days = Math.floor(t/24);
        var hours = Math.floor(t - days*24);
        this.$('.timeview').html('Time: ' + days + ' days and ' + hours + ' hours.');
    },

    configureSlider: function(minT,maxT,stepSize, onSlide) {
        this.$('.event-rate-slider').slider('option', 'min', minT)
                             .slider('option', 'max', maxT)
                             .slider('option', 'step', stepSize)
                             .slider('option', 'slide', onSlide);
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

        this.$('.event-rate-slider').slider();


        return this;
    },
});

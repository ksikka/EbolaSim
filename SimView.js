/* UI Code */
var CLASSMAP = {};
CLASSMAP[E.HEALTHY] = 'l-healthy';
CLASSMAP[E.EXPOSE] = 'l-exposed';
CLASSMAP[E.INFECT] = 'l-infected';
CLASSMAP[E.SYMPTOM] = 'l-symptomatic';
CLASSMAP[E.DEATH] = 'l-dead';
CLASSMAP[E.HOSPITAL] = 'l-hospitalized';
CLASSMAP[E.RECOVER] = 'l-recovered';

var LatticeView = Backbone.View.extend({

    initialize: function(opts) {
        this.m = opts.m;
        this.n = opts.n;
        this.states = _.map(_.range(opts.m), function(i) {
            return _.map(_.range(opts.n), function(j) {
                return E.HEALTHY;
            });
        });
        this.numPartialRows = 0;
    },

    $cell: function(i, j) {
        return this.$('tr:nth-child('+(i+1)+') td:nth-child('+(j+1)+')');
    },

    changeToState: function(i,j,state) {
        var $cell = this.$cell(i,j);
        try{
        $cell.removeClass(CLASSMAP[this.states[i][j]]);
        } catch (e){
            console.log(i + ' '+ j);
        }
        this.states[i][j] = state;
        $cell.addClass(CLASSMAP[this.states[i][j]]);
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

    _createPartialRow: function() {
        // hidden because you should only do this if the last partial row is full.
        var $t = this.$('table');
        var $r = $('<tr></tr>');
        _.times(this.n, function() {
            $('<td class="l-hidden"></td>').appendTo($r);
        });
        $r.appendTo($t);
        this.numPartialRows ++;
        this.partialI = 0; // index of the next PCell to unhide.
    },

    _unHideNextPCell: function () {
        // If the last row is not a partial row,
        // Or if the last row is full,
        // create a new partial row
        if (this.partialI === undefined || this.partialI >= this.n)
            this._createPartialRow();

        var i = this.m - 1 + this.numPartialRows;
        var j = this.partialI;

        this.$cell(i,j).removeClass('l-hidden');
        this.partialI ++;
    },

    addCell: function() {
        // This adds a cell to the bottom for the hospital
        // patients. Supports partial rows.

        this._unHideNextPCell();
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
        var self = this;
        _.each(CLASSMAP, function(classname, state) {
            self.$('.'+classname+'-count').html(stateCount[state]);
        });
    },

    render: function() {
        if (!this.hlv)
            this.hlv = new LatticeView({ el:this.$('.hosp-lattice'), m:1, n:this.n });
        if (!this.plv)
            this.plv = new LatticeView({ el:this.$('.pop-lattice'), m:this.m, n:this.n });
        this.plv.render();
        this.hlv.render();

        this.$('.event-rate-slider').slider();


        return this;
    },
});

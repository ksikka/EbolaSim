var SimViewController = function (el, m, n, eventHistory) {
    if (eventHistory.length === 0)
        alert('Empty simulation.')

    this.eventHistory = eventHistory;

    this.simview = new SimView({el:el, m:m, n:n});
    this.simview.render();

    this.curI = 0;

    // event rate slider initialization
    var self = this;
    var FPS = 30; this.FPS = FPS;
    var stepSize = 20; this.stepSize = stepSize;
    this.simview.configureSlider(-1 * stepSize * FPS, stepSize * FPS, stepSize, function(arg1,arg2) { return self.onSlide(arg1,arg2); });

    this.epsRate = 120;
    this.simview.$('.event-rate-slider').slider('value', this.epsRate);
    this.updateEPSView();

    this.startUpdateTimer();
};

SimViewController.prototype.startUpdateTimer = function() {
    if (this.updateTimer !== undefined) return;

    var self = this;
    this.updateTimer = window.setInterval(function() {
        // events per frame
        var EPF = self.epsRate / self.FPS;
        var reachedBoundary;
        for (var i = 0; i < Math.abs(EPF); i ++) {
            if (EPF < 0) {
                reachedBoundary = self.stepBackward();
            } else {
                reachedBoundary = self.stepForward();
            }
            if (reachedBoundary) {
                self.stopUpdateTimer(); // save some CPU cycles. timer will be started again when epsRate goes the other way.
                break;
            }
        }

        var eh = self.eventHistory[self.curI];
        var e = eh[0], stateCount = eh[1];
        self.simview.updateTimeView(e.t);
        self.simview.updateStateCountView(stateCount);

    }, 1000 / self.FPS);
};

SimViewController.prototype.stopUpdateTimer = function() {
    if (this.updateTimer === undefined) return;

    window.clearInterval(this.updateTimer);
    delete this.updateTimer;
};

SimViewController.prototype.stepForward = function() {
    if (this.curI < (this.eventHistory.length - 1)) {
        // apply next event.
        this.curI ++;

        var eh = this.eventHistory[this.curI];
        var ef = eh[0], stateCount = eh[1];
        this.simview.plv.changeToState(ef.i, ef.j, ef.type);

        //this.simview.$('.event-rate-slider').slider('value', this.curI);
        return false;
    }
    return true;
};

SimViewController.prototype.stepBackward = function() {
    if (this.curI > 0) {
        var eh = this.eventHistory[this.curI];
        var e0 = eh[0];

        // undo the old event
        this.simview.plv.changeToState(e0.i, e0.j, e0.oldState);

        this.curI --;

        // apply previous event
        eh = this.eventHistory[this.curI];
        var ef = eh[0], stateCount = eh[1];
        this.simview.plv.changeToState(ef.i, ef.j, ef.type);

        // this.simview.$('.event-rate-slider').slider('value', this.curI);
        return false;
    }
    return true;
};


SimViewController.prototype.updateEPSView = function() {
    this.simview.$('.eventrateview').html(this.epsRate + ' events per second.');
};

SimViewController.prototype.onSlide = function(e, ui) {
    var oldRate = this.epsRate;
    this.epsRate = ui.value;
    // save some CPU cycles by turning off the timer if new rate is 0
    if (this.epsRate === 0 && oldRate !== 0) {
        this.stopUpdateTimer();
    }
    if (oldRate === 0 && this.epsRate !== 0) {
        this.startUpdateTimer();
    }
    // timer may also be stopped because of boundary condition
    // if the rate was negative, then the user touches to positive,
    // the rate will skip 0, and above logic wont work
    // detect this by checking if the rate's sign differ.
    // if the rate's signs differ, then their product will be negative
    if (oldRate * this.epsRate < 0) {
        this.startUpdateTimer();
    }
    this.updateEPSView();

};

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
    var stepSize = 10; this.stepSize = stepSize;
    this.simview.configureSlider(-1 * stepSize * FPS, stepSize * FPS, stepSize, function(arg1,arg2) { return self.onSlide(arg1,arg2); });

    this.epsRate = 120;
    this.simview.$('.event-rate-slider').slider('value', this.epsRate);

    this.goToZero();
    this.play();
};

SimViewController.prototype.play = function() {
    var self = this;
    this.updateTimer = window.setInterval(function() {
        // events per frame
        var EPF = self.epsRate / self.FPS;
        for (var i = 0; i < Math.abs(EPF); i ++) {
            if (EPF < 0) {
                self.stepBackward();
            } else {
                self.stepForward();
            }
        }

        var eh = self.eventHistory[self.curI];
        var e = eh[0], stateCount = eh[1];
        self.simview.updateTimeView(e.t);
        self.simview.updateStateCountView(stateCount);

    }, 1000 / self.FPS)
};

SimViewController.prototype.stepForward = function() {
    if (this.curI < (this.eventHistory.length - 1)) {
        console.log('moving forward');
        // apply next event.
        this.curI ++;

        var eh = this.eventHistory[this.curI];
        var ef = eh[0], stateCount = eh[1];
        this.simview.plv.changeColor(ef.i, ef.j, COLORMAP[ef.type]);

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
        this.simview.plv.changeColor(e0.i, e0.j, COLORMAP[e0.oldState]);

        this.curI --;

        // apply previous event
        eh = this.eventHistory[this.curI];
        var ef = eh[0], stateCount = eh[1];
        this.simview.plv.changeColor(ef.i, ef.j, COLORMAP[ef.type]);

        // this.simview.$('.event-rate-slider').slider('value', this.curI);
        return false;
    }
    return true;
};

SimViewController.prototype.goToTime = function(t) {
    /* Update to the last event where time = t. */
    var goLeft = t < this.curI;
    while (this.curI != t) {
        var reachedBoundary;
        if (goLeft) {
            reachedBoundary = this.stepBackward();
        } else {
            reachedBoundary = this.stepForward();
        }
        if (reachedBoundary)
            break;
    }

};

SimViewController.prototype.goToZero = function() {
    this.goToTime(0);
};

SimViewController.prototype.onSlide = function(e, ui) {
    this.epsRate = ui.value;
};

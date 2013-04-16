(function(CurChart) {

var Chart = function(canvasSelector, options) {
    var el = $(canvasSelector),
        o = options || {};
    if (!el.size()) {
        throw new Error('Canvas not exist');
    }
    o.width = o.width || el.width();
    o.height = o.height || el.height();
    this.calcOptions(o);
    this.paper = Raphael(el.get(0), o.width, o.height);
    this.points = [];
    this.startLoading();
    this.max = 0;
    this.min = Infinity;
}

Chart.prototype = {
    /**
     * @private
     * Calculate params from recieved options
     */
    calcOptions: function(o) {
        o.count = o.count || 40;
        o.scaleWidth = Math.max(o.width * 0.05, 40);
        o.step = (o.width - o.scaleWidth - 10) / o.count;
        o.bot = o.height - Math.max(o.height*0.04, 40);
        this.o = o;
    },

    /**
     * Add data for render on chart
     * 
     * @arg data [{ datetime: Date, value: Number }]
     */
    addData: function(data) {
        var self = this,
            forRender = [],
            min = Infinity,
            max = 0;
        
        if ( data.length > this.o.count ) {
            data.splice(0, data.length - this.o.count);
        }
	
	//crate new points
        $.each(data, function() {
            var point = new CurChart.Point(self, this.datetime, this.value);
            min = Math.min(this.value, min);
            max = Math.max(this.value, max);
            forRender.push(point);
        });
        
	// how many old points we must remove?
	// new - free; free = max_count - cur_count
        var remove = Math.max(0, data.length - (this.o.count - this.points.length));

	// remove old points
        this.erasePoints(remove);
	// recalc scale
        this.updateScale(min, max);
	// add new points on chart
        $.each(forRender, function() {
	    this.render(self.prev);
	    self.prev = this;
        });

        this.points = this.points.concat(forRender);
        if ( this.isLoading() ) {
            this.stopLoading();
        }
    },

    /**
     * Recalc scale of chart
     * 
     * @arg min Number
     * @arg max Number
     */
    updateScale: function(min, max) {
        if ( this.calcScale(min, max) ) {
            this.updatePointsPosition();
            this.renderScale();
	}
    },

    /**
     * Recalculate scale borders, return false if nothing is changed
     * 
     * @arg min Number
     * @arg max Number
     */
    calcScale: function(min, max) {
	if ( !(this.min - min) && !(this.max - max) ) {
	    return false;
	}

        this.min = Math.min(this.min, min);
        this.max = Math.max(this.max, max);
        var gap = (this.max - this.min) * 0.05;
        this.minDisplay = this.min - gap;
        this.maxDisplay = this.max + gap;
        this.scaleHeight = this.maxDisplay - this.minDisplay;
	return true;
    },

    // update y-positon of points on change scale
    updatePointsPosition: function() {
        $.each(this.points, function() {
            this.update();
        });
    },
    
    /**
     * @private
     * Erase points on left side of chart
     * used befor render new data
     */
    erasePoints: function(num) {
        var self = this,
            trash = this.points.splice(0, num),
            min = Infinity, max = 0;
        $.each(trash, function() {
            this.remove();
        });
	// move old rest and recalc new value difference
        $.each(this.points, function() {
           min = Math.min(min, this.value);
           max = Math.max(max, this.value);
           this.update(-(self.o.step * num), 0);
        });

	// if we have points => remove line on first
        if ( this.points.length ) {
            this.points[0].removeLine();            
        }
        this.min = min;
        this.max = max;
    },

    // loading API and drawning
    loadingText: 'Loading...',

    startLoading: function() {
        if ( this.loadingBox ) {
            this.loadingBox.show();         
        }
        else {
            this.loadingBox = this.renderLoadingBox(this.paper);
        }

        this.loadingBox.visible = true;
    },

    stopLoading: function() {
        if ( !this.loadingBox ) {
            return;
        }
        this.loadingBox.hide();
        this.loadingBox.visible = false;
    },

    isLoading: function() {
        return !!(this.loadingBox && this.loadingBox.visible);
    },

    renderLoadingBox: function(p) {
        var l = this.loadingBox = p.set(),
            W = 100, H = 30,
            pos = {
                x: this.o.width/2 - W/2,
                y: this.o.height/2 - H/2,
                width: W,
                height: H
            },
            border = p.rect(pos.x, pos.y, pos.width, pos.height, 5),
            text = p.text(this.o.width/2, this.o.height/2, this.loadingText);
        border.attr({
            'stroke': '#000',
            'stroke-width': 2
        });
        l.push(border, text);
        return l;       
    },

    // render or update scale
    renderScale: function() {
        if ( this.scaleEl ) {
            this.scaleEl.remove();
        }
        var el = this.scaleEl = this.paper.set(),
            top = this.o.height * 0.03,
            bot = this.o.bot,
            sw = this.o.scaleWidth,
	    // draw vertical line
            vert = this.line({ x: sw, y: top },
                             { x: sw, y: bot }),
	    // draw horizontal line
            horiz = this.line({ x: sw, y: bot },
                             { x: this.o.width, y: bot }),
	    // length of one grad in pixels
            vertStep = (bot - top) / 10,
	    // length of one grad in values
            vertValueStep = this.scaleHeight / 10; 
        
	// draw dashes on vertical scale and grid lines
        for(var i = 0; i <= 10; i++) {
            var l = this.line({ x: sw - 5, y: bot - i*vertStep },
                              { x: sw, y: bot - i*vertStep }),
	        grid = this.line({ x: sw - 5, y: bot - i*vertStep },
                              { x: this.o.width, y: bot - i*vertStep }),
                t = this.paper.text(sw - this.o.scaleWidth/2 - 5, 
                                    bot - i*vertStep, 
                                    (this.minDisplay + i * vertValueStep).toFixed(2));
	    grid.attr({ 'stroke-width': 1, 'stroke-opacity': 0.2 });
            el.push(l, grid, t);
        }
        
	// draw dashes on horisontal scale
        for(var i = 0; i <= this.o.count; i++) {
            var l = this.line({ x: sw + i*this.o.step, y: bot },
                              { x: sw + i*this.o.step, y: bot + 3 });
            el.push(l);
        }
        el.push(vert, horiz);
        return el;
    },

    // drawning
    line: function(f, t) {
        var p = 'M' + f.x + ',' + f.y +
                'L' + t.x + ',' + t.y,
            line = this.paper.path(p);
        line.attr({ 'stroke-width': 2, 'stroke-opacity': 0.5 });
        return line;
    }

};

CurChart.Chart = Chart;

})(window.CurChart || (window.CurChart = {}));

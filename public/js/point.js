(function(CurChart) {


var Point = function(chart, datetime, value) {
    this.datetime = datetime;
    this.value = value;
    this.chart = chart;
}

Point.prototype = {
    /** 
     * Return position of point
     */
    pos: function() {
        return $.extend({}, this.position);
    },
    
    /**
     * @private
     * Set position of point
     */
    setPos: function(x, y) {
        this.position = {
            x: x,
            y: y
        };
    },
    
    /**
     * Render point on chart
     * 
     * @arg prev Point Previous point on chart
     */
    render: function(prev) {
        var p = this.chart.paper,
            x = prev ?
                prev.pos().x + this.chart.o.step :
                this.chart.o.scaleWidth + 1,
            y = this.calcYPosition();

        this.setPos(x, y);
        this.pointEl = p.set();
        
        var e = this.renderPoint(p, x, y);
        
        if ( prev ) {
            this.prev = prev;
            var line = this.chart.line(prev.pos(), this.pos());
            this.line = line;
        }

        var l = this.renderLabel(p, x);
        
        this.pointEl.push(e, l);
        return this.pointEl;
    },

    // draw point on paper
    renderPoint: function(p, x, y) {
        var e = this.circle = p.circle(x, y, 1);
        e.attr({'stroke-width': 3, 'fill': '#000' });
        e.attr('fill', '#000');
        e.hover($.proxy(this.onHover, this));
        e.mouseout($.proxy(this.onOut, this));        
        return e;
    },

    // draw label on horizontal scale
    renderLabel: function(p, x) {
        var l = this.label = p.text(x, this.chart.o.bot + 20, this.formatTime(this.datetime));
        l.transform('r90');
        return l;        
    },


    /**
     * Update point position
     * It called on scale update and move then pointes removed
     */
    update: function(dx, dy) {
        if ( typeof dy == 'undefined' ) {
            dy = this.calcYPosition() - this.position.y;
        }
        var x = this.position.x + (dx || 0),
            y = this.position.y + dy;
	// redraw point
        this.circle.remove();
        this.renderPoint(this.chart.paper, x, y);
        this.setPos(x, y);
	// rerender line if it exist
        if ( this.line ) {
            this.line.remove();
            this.line = this.chart.line(this.prev.pos(), this.pos());
        }
	// redraw render if x position changed
	if ( dx ) {
            this.label.remove();
            this.renderLabel(this.chart.paper, x);
	}
    },

    /**
     * Remove point from chart
     */
    remove: function() {
        this.pointEl.remove();
        this.circle.remove();
        this.removeLine();
        this.label.remove();
    },

    /**
     * Remove point line
     */
    removeLine: function() {
        this.line && this.line.remove();
        this.line = null;
    },

    /**
     * Return point y-position depend on scale
     */
    calcYPosition: function() {
        var h = this.chart.o.bot,
            diff = this.value - this.chart.minDisplay,
            rate = diff/this.chart.scaleHeight;
        return h - ~~(h * rate);  
    },

    formatTime: function(time) {
        var m = time.getMinutes(),
            s = time.getSeconds();
        m = m > 9 ? m : '0' + m;
        s = s > 9 ? s : '0' + s;
        return m  + ':' + s;
    },

    onHover: function() {
        var el = this.circle;
        el.toFront();
        el.animate({ 'stroke-width': 0, r: 5 }, this.animateTime);
    },

    onOut: function() {
        this.pointEl.animate({ 'stroke-width': 3, r: 1 }, this.animateTime);
    },

    animateTime: 200
};

CurChart.Point = Point;

})(window.CurChart || (window.CurChart = {}));
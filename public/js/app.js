$(function() {
    function updateData(data) {
	chart.addData(data);
    }

    var chart = new CurChart.Chart('#canvas', { width: 600, height: 400 }),
        ds = new CurChart.DataSource(updateData);
});
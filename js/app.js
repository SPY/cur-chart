$(function() {
    function updateData(data) {
	chart.addData(data);
    }

    var chart = new CurChart.Chart('#canvas', { width: 400, height: 300 }),
        ds = new CurChart.DataSource(updateData);
});
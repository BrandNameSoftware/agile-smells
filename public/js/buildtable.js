function drawTable(labelValueArray, projectKey, sprintIDMapping, boardID) {
    //TODO: add points added
  var columnProps = ['label', 'value', 'points', 'startDate', 'endDate'];
  var columnLabels = ['Sprint Name', 'Stories Added', 'Points Added', 'Start Date', 'End Date'];

  var table = d3.select('.table').append('table').attr("class", "aui");
  var thead = table.append('thead');
  var	tbody = table.append('tbody');

  // append the header row
  thead.append('tr')
    .selectAll('th')
    .data(columnLabels).enter()
    .append('th')
      .text(function (column) { return column; });

  // create a row for each object in the data
  var rows = tbody.selectAll('tr')
    .data(labelValueArray)
    .enter()
    .append('tr');

  // create a cell in each row for each column
  var cells = rows.selectAll('td')
    .data(function (row) {
      return columnProps.map(function (column) {
        return {column: column, value: row[column]};
      });
    })
    .enter()
    .append('td');
    //.text(function (d) { return d.value; });

    cells.filter(function(d, i) { return i === 0})
		.append("a")
    .attr("href", function(d) {
      var sprintReportURL = "https://brandnamesoftware.atlassian.net/secure/RapidBoard.jspa?rapidView=" + boardID + "&projectKey=" + projectKey + "&view=reporting&chart=sprintRetrospective&sprint=" + sprintIDMapping[d.value];
        return sprintReportURL;
    })
    .html(function(d) {
        return (d.value);
    });

    cells.filter(function(d, i) { return i !== 0})
      .html(function(d) {
          return (d.value);
      });
}

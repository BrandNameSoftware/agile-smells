function drawExampleChart()
{
  var data = [
    {name: "Locke",    value:  4},
    {name: "Reyes",    value:  8},
    {name: "Ford",     value: 15},
    {name: "Jarrah",   value: 16},
    {name: "Shephard", value: 23},
    {name: "Kwon",     value: 42}
  ];

  var margin = {top: 20, right: 30, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scaleBand()
    .domain(data.map(function(d) { return d.name; }))
    .range([0, width], .1);

var y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return d.value; })])
    .range([height, 0]);

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xAxis = d3.axisBottom(x);
  var yAxis = d3.axisLeft(y);

  chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  chart.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  chart.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.name); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .attr("width", x.bandwidth()*.9);
}

function drawBarChart(labelValueArray)
{

  var margin = {top: 20, right: 30, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scaleBand()
    .domain(labelValueArray.map(function(d) { return d.label; }))
    .range([0, width], .1);

var y = d3.scaleLinear()
    .domain([0, d3.max(labelValueArray, function(d) { return d.value;})])
    .range([height, 0]);

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xAxis = d3.axisBottom(x);
  var yAxis = d3.axisLeft(y);

  chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  chart.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  chart.selectAll(".bar")
      .data(labelValueArray)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.label); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .attr("width", x.bandwidth()*.9);
}

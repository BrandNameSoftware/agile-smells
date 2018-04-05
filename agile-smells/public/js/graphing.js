function drawExampleChart() {
  var data = [{
      name: "Locke",
      value: 4
    },
    {
      name: "Reyes",
      value: 8
    },
    {
      name: "Ford",
      value: 15
    },
    {
      name: "Jarrah",
      value: 16
    },
    {
      name: "Shephard",
      value: 23
    },
    {
      name: "Kwon",
      value: 42
    }
  ];

  var margin = {
      top: 20,
      right: 30,
      bottom: 30,
      left: 40
    },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var x = d3.scaleBand()
    .domain(data.map(function(d) {
      return d.name;
    }))
    .range([0, width], .1);

  var y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) {
      return d.value;
    })])
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
    .attr("x", function(d) {
      return x(d.name);
    })
    .attr("y", function(d) {
      return y(d.value);
    })
    .attr("height", function(d) {
      return height - y(d.value);
    })
    .attr("width", x.bandwidth() * .9);
}

function drawBarChart(labelValueArray) {
  var baseHeight = 150;
  var baseWidth = 300;
  var margin = {
      top: 10,
      right: 30,
      bottom: 30,
      left: 20
    },
    width = baseWidth - margin.left - margin.right,
    height = baseHeight - margin.top - margin.bottom;

  var xScale = d3.scaleBand()
    .domain(labelValueArray.map(function(d) {
      return d.label;
    }))
    .range([0, width])
    .padding(0.1);

  var yScale = d3.scaleLinear()
    .domain([0, d3.max(labelValueArray, function(d) {
      return d.value;
    }) + 1])
    .range([height, 0]);

  var chart = d3.select('.chart')
    .append("svg")
    .attr('viewBox', '0 0 ' + baseWidth + ' ' + baseHeight)
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xAxis = d3.axisBottom(xScale);
  var yAxis = d3.axisLeft(yScale).ticks(d3.max(labelValueArray, function(d) {
    return d.value;
  }));

  chart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  chart.append("g")
    .attr("class", "y axis")
    .call(yAxis);


  // text label for the y axis
  chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", ".8em")
    .attr("class", "axisLabel")
    .text("Number of issues");

  chart.selectAll(".bar")
    .data(labelValueArray)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) {
      return xScale(d.label);
    })
    .attr("y", function(d) {
      return yScale(d.value);
    })
    .attr("height", function(d) {
      return height - yScale(d.value);
    })
    .attr("width", xScale.bandwidth());
}

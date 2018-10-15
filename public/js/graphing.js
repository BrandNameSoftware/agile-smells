function drawBarChart(labelValueArray, projectKey, sprintIDMapping, boardID) {
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
  })/2);


  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<strong>Scope change</strong><br></br><span>Issues Added </span><span class='tooltipValue'>" + d.value + "</span>";
    });

  chart.call(tip);

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
    .enter()
    /*.append("a")
    .attr("xlink:href", function(d) {return "/secure/RapidBoard.jspa?rapidView=" + boardID + "&projectKey=" + projectKey + "&view=reporting&chart=sprintRetrospective&sprint=" + sprintIDMapping[d.label]})
    .attr("target", function(d) {return "_parent"})*/
    .append("rect")
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
    .attr("width", xScale.bandwidth())
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);
}

function drawExampleChart()
{
  var data = [30, 86, 168, 281, 303, 365];

d3.select(".chart")
  .selectAll("div")
  .data(data)
    .enter()
    .append("div")
    .style("width", function(d) { return d + "px"; })
    .text(function(d) { return d; });
}
function doStuff(response){
  // convert the string response to JSON
  response = JSON.parse(response);

  // dump out the response to the console
  console.log('project - ' + response);
}

function testQueryJIRA() {
  AP.require('request', function(request) {
    request({
      url: '/rest/api/2/issue/KT-1',
      success: doStuff,
      error: function() {
        console.log(arguments);
      }
    });
  });
}

function setData() {

  //var rapidViewID = getRapidViewID(projectKey);
  //TODO: Need to get the boardID dynamically. Likely tied to letting user configure which project.
  var boardID = 1;
  getAllSprints(boardID);
}

var addedIssues = {};

function getAllSprints(boardID) {
  //TODO: this breaks if there are more than 50 sprints. This should be tied to when we let them configure the number of sprints to look back and don't let them choose greater than 50
  AP.request({
      //future sprints are not needed
      url: '/rest/agile/1.0/board/' + boardID + '/sprint?state=active,closed',
      success: function(response) {

        // convert the string response to JSON
        response = JSON.parse(response);

        for(var i = 0; i < response.values.length; i++)
        {
          /*there are 2 ways we have to check for added stories
        	* If created after a sprint started and it's in a sprint
        	* The latest changelog with a sprint modification added it to a sprint after the sprint was started*/
          setStoriesAdded(response.values[i].id);
          //this might be a race condition since it's an async call
        }
      },
      error: function() {
        console.log(arguments);
      }
    });
}

function setStoriesAdded(sprintID) {
  AP.request({
      //TODO: breaks after 50 issues, need pagination
      //future sprints are not needed
      url: '/rest/agile/1.0/sprint/' + sprintID + '/issue?expand=changelog&fields=changelog,sprint,created,closedSprints',
      success: checkForAddedIssues,
      error: function() {
        console.log(arguments);
      }
    });
}

function checkForAddedIssues(response) {
  // convert the string response to JSON
  response = JSON.parse(response);

  for (var i = 0; i < response.issues.length; i++) {
    var issue = response.issues[i];
    checkActiveSprintAsPartOfCreation(issue);
    checkClosedSprintAsPartOfCreation(issue);
    checkAddedToActiveSprintAfterCreated(issue);
    checkAddedToClosedSprintAfterCreated(issue);
  }
  console.log(addedIssues);
}

function checkActiveSprintAsPartOfCreation(issue) {
  if(issue.fields.sprint != null) {
    checkSprintAsPartOfCreation(issue, issue.fields.sprint)
  }
}

function checkSprintAsPartOfCreation(issue, sprint) {
  var createdTimestamp = issue.fields.created;
  var sprintCreatedTimestamp = sprint.startDate;
  if (createdTimestamp > sprintCreatedTimestamp) {
    addedIssues[sprint.id + '-' + issue.id] = issue.key;
  }
}

function checkClosedSprintAsPartOfCreation(issue) {
  if(issue.fields.closedSprints != null) {
    for(var i = 0; i <issue.fields.closedSprints.length; i++) {
      checkSprintAsPartOfCreation(issue, issue.fields.closedSprints[i]);
    }
  }
}

function checkAddedToActiveSprintAfterCreated(issue) {
  if(issue.fields.sprint != null) {
    checkAddedToSprintAfterCreated(issue, issue.fields.sprint);
  }
}

function checkAddedToSprintAfterCreated(issue, sprint) {
var sprintName = sprint.name;
  var sprintCreatedTimestamp = sprint.startDate;
  for(var i = 0; i < issue.changelog.histories.length; i++) {
    var currentHistory = issue.changelog.histories[i];
    for(var j = 0; j < currentHistory.items.length; j++) {
      var historyItem = currentHistory.items[j];
      var fieldChange = historyItem.field;
      if(fieldChange == "Sprint") {
        var timestampOfChange = currentHistory.created;
        var sprintString = historyItem.toString;
        if(sprintString.includes(sprintName) && timestampOfChange > sprintCreatedTimestamp) {
          addedIssues[sprint.id + '-' + issue.id] = issue.key;
          return;
        }
      }
    }
  }
}

function checkAddedToClosedSprintAfterCreated(issue) {
  if(issue.fields.closedSprints != null) {
    for(var i = 0; i <issue.fields.closedSprints.length; i++) {
      checkAddedToSprintAfterCreated(issue, issue.fields.closedSprints[i]);
    }
  }
}

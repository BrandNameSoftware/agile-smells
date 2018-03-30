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

function testQueryJIRA() {console.log('here1');
  AP.require('request', function(request) {
    request({
      url: '/rest/api/2/issue/KT-1',
      success: function(response) {
        // convert the string response to JSON
        response = JSON.parse(response);

        // dump out the response to the console
        console.log('project - ' + response);
      },
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
  var sprints = getAllSprints(boardID);
  console.log('here4');
  for(var i = 0; i < sprints.length; i++)
  {
    console.log('here5');
    var addedStories = getAddedStories(sprints[i].id);
  }
}

function getAddedStories(sprintID) {
  var addedStories = [];
  /*there are 2 ways we have to check for added stories
	* If created after a sprint started and it's in a sprint
	* The latest changelog with a sprint modification added it to a sprint after the sprint was started*/
  addedStories.push(getStoriesAddedAsPartofCreation(sprintID));
}

function getStoriesAddedAsPartofCreation(sprintID) {
  var addedIssues = [];
  var issues;
  AP.request({
      //TODO: breaks after 50 issues, need pagination
      //future sprints are not needed
      url: 'rest/agile/1.0/sprint/' + sprintID + '/issue?expand=changelog&fields=changelog,sprint,created,closedSprints',
      success: function(response) {
        // convert the string response to JSON
        response = JSON.parse(response);

        issues = response.issues;
        // dump out the response to the console
        console.log(response);
      },
      error: function() {
        console.log(arguments);
      }
    });

  for (var issue in issues) {
    var isAdded = false;
    isAdded = checkActiveSprintAsPartOfCreation(issue);
    if(!isAdded) {
      isAdded = checkClosedSprint(issue);
    }

    if(isAdded) {
      console.log('Added issue: ' + issue.key)
      addedIssues.push(issue);
    }
  }
  return addedIssues;
}

function checkActiveSprintAsPartOfCreation(issue) {
  var createdTimestamp = issue.fields.created;
  var sprintCreatedTimestamp = issue.fields.sprint.startDate;
  if (createdTimestamp > sprintCreatedTimestamp) {
    return true;
  }
  else {
    return false;
  }
}

function checkClosedSprintAsPartOfCreation() {

}

function getAllSprints(boardID) {
  console.log('here1');
  var sprints = [];
  //TODO: this breaks if there are more than 50 sprints. This should be tied to when we let them configure the number of sprints to look back and don't let them choose greater than 50
  AP.request({
      //future sprints are not needed
      url: '/rest/agile/1.0/board/' + boardID + '/sprint?state=active,closed',
      success: function(response) {
        console.log('here2');
        // convert the string response to JSON
        response = JSON.parse(response);

        sprints.push(response.values);
        // dump out the response to the console
        console.log(response);
      },
      error: function() {
        console.log(arguments);
      }
    });
console.log('here3');
  return sprints;
}

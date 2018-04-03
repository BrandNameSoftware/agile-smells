function setData() {

  //var rapidViewID = getRapidViewID(projectKey);
  //TODO: Need to get the boardID dynamically. Likely tied to letting user configure which project.
  var boardID = 1;
  getAllSprints(boardID);
}

var addedIssues = {};
var currentProcessingSprintID = 0;

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
          addedIssues[response.values[i].name] = {};
          setStoriesAdded(response.values[i].id);
          //this might be a race condition since it's an async call
        }
      },
      error: function() {
        console.log(arguments);
      }
    });
}

function setStoriesAdded(currentProcessingSprintID) {
  AP.request({
      //TODO: breaks after 50 issues, need pagination
      //future sprints are not needed
      url: '/rest/agile/1.0/sprint/' + currentProcessingSprintID + '/issue?expand=changelog&fields=changelog,sprint,created,closedSprints,creator',
      success: function(response) {
        checkForAddedIssues(response, currentProcessingSprintID);
      },
      error: function() {
        console.log(arguments);
      }
    });
}

function checkForAddedIssues(response, currentProcessingSprintID) {
  // convert the string response to JSON
  response = JSON.parse(response);

  for (var i = 0; i < response.issues.length; i++) {
    var issue = response.issues[i];
    checkActiveSprintAsPartOfCreation(issue, currentProcessingSprintID);
    checkClosedSprintAsPartOfCreation(issue, currentProcessingSprintID);
    checkAddedToActiveSprintAfterCreated(issue, currentProcessingSprintID);
    checkAddedToClosedSprintAfterCreated(issue, currentProcessingSprintID);
  }
  console.log(addedIssues);
}

function checkActiveSprintAsPartOfCreation(issue, currentProcessingSprintID) {
  if(issue.fields.sprint != null && issue.fields.sprint.id == currentProcessingSprintID) {
    checkSprintAsPartOfCreation(issue, issue.fields.sprint)
  }
}

function checkSprintAsPartOfCreation(issue, sprint) {
  //thanks JIRA for storing some dates in UTC and some in local time. sprint start date is stored UTC
  var timeZone = issue.fields.creator.timeZone;
  var createdTimestamp = moment(issue.fields.created).tz(timeZone);
  var sprintCreatedTimestamp = moment(sprint.startDate);
  if (createdTimestamp > sprintCreatedTimestamp) {
    addedIssues[sprint.name][issue.id] = issue;
  }
}

function checkClosedSprintAsPartOfCreation(issue, currentProcessingSprintID) {
  if(issue.fields.closedSprints != null) {
    for(var i = 0; i <issue.fields.closedSprints.length; i++) {
      if(issue.fields.closedSprints[i].id == currentProcessingSprintID) {
        checkSprintAsPartOfCreation(issue, issue.fields.closedSprints[i]);
      }
    }
  }
}

function checkAddedToActiveSprintAfterCreated(issue, currentProcessingSprintID) {
  if(issue.fields.sprint != null && issue.fields.sprint.id == currentProcessingSprintID) {
    checkAddedToSprintAfterCreated(issue, issue.fields.sprint);
  }
}

function checkAddedToSprintAfterCreated(issue, sprint) {
var sprintName = sprint.name;
  var sprintStartDate = sprint.startDate;
  for(var i = 0; i < issue.changelog.histories.length; i++) {
    var currentHistory = issue.changelog.histories[i];
    for(var j = 0; j < currentHistory.items.length; j++) {
      var historyItem = currentHistory.items[j];
      var fieldChange = historyItem.field;
      if(fieldChange == "Sprint") {
        //thanks JIRA for storing some dates in UTC and some in local time. sprint start date is stored UTC
        var timeZone = currentHistory.author.timeZone;
        var timestampOfChange = moment(currentHistory.created).tz(timeZone);
        var sprintString = historyItem.toString;
        if(sprintString.includes(sprintName) && timestampOfChange > moment(sprintStartDate)) {
          addedIssues[sprint.name][issue.id] = issue;
          return;
        }
      }
    }
  }
}

function checkAddedToClosedSprintAfterCreated(issue, currentProcessingSprintID) {
  if(issue.fields.closedSprints != null) {
    for(var i = 0; i <issue.fields.closedSprints.length; i++) {
      if(issue.fields.closedSprints[i].id == currentProcessingSprintID) {
        checkAddedToSprintAfterCreated(issue, issue.fields.closedSprints[i]);
      }
    }
  }
}

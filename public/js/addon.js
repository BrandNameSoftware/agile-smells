function setData() {
  var projectID = getParameterByName('project.id');;
  var rapidViewID = getAllBoards(projectID);
}

var fullSprintsToProcess;
function getAllBoards(projectID) {
  var boardsToProcess = [];
  //TODO: I shouldn't be having to loop through all boards, I should have the board ID from context parm. I think there's a bug
  AP.request({
    //future sprints are not needed
    url: '/rest/agile/1.0/board/?projectKeyOrId=' + projectID,
    success: function(response) {

      // convert the string response to JSON
      response = JSON.parse(response);

      for (var i = 0; i < response.values.length; i++) {
        boardsToProcess.push(response.values[i].id);
      }

      var allSprintsPromises = boardsToProcess.map(getAllSprints);

      Promise.all(allSprintsPromises).then(function() {
        var flattenedIssues = getLabelValuesForGraphing();

        var sprintMap = getNameToIDSprintsMap();
        drawBarChart(flattenedIssues, projectID, sprintMap, response.values[0].id);
        drawTable(flattenedIssues, projectID, sprintMap, response.values[0].id);
      }).catch(function(error) {
        console.log(error);
      })
    },
    error: function() {
      console.log(arguments);
    }
  });
}

var addedIssues = {};
var currentProcessingSprintID = 0;

function getAllSprints(boardID) {
  var sprintsToProcess = [];
  //TODO: this breaks if there are more than 50 sprints. This should be tied to when we let them configure the number of sprints to look back and don't let them choose greater than 50
  return new Promise(function(resolve, reject) {
    AP.request({
      //future sprints are not needed
      url: '/rest/agile/1.0/board/' + boardID + '/sprint?state=active,closed',
      success: function(response) {

        // convert the string response to JSON
        response = JSON.parse(response);

        var maxSprints = 10;
        for (var i = 0; (i < response.values.length) && (i < maxSprints); i++) {
          sprintsToProcess.push(response.values[i]);
        }
        fullSprintsToProcess = sprintsToProcess;

        var addedStoriesPromises = sprintsToProcess.map(setStoriesAdded);

        Promise.all(addedStoriesPromises).then(function() {
          resolve(response);
        }).catch(function(error) {
          console.log(error);
        })
      },
      error: function() {
        console.log(arguments);
        reject(arguments);
      }
    });
  });
}

function getLabelValuesForGraphing() {
  var valuesToGraph = [];
  var sortedKeys = Object.keys(addedIssues).sort(function(a, b) {
    var key1 = a.substring(0, a.indexOf("-"));
    var key2 = b.substring(0, b.indexOf("-"));
    return key1 - key2;
  });
  for (var i = 0; i < sortedKeys.length; i++) {
    var issues = addedIssues[sortedKeys[i]];
    var valueToGraph = {};
    Object.defineProperties(valueToGraph, {
      "label": {
        value: sortedKeys[i].substring(sortedKeys[i].indexOf("-") + 1),
        configurable: true
      },
      "value": {
        value: Object.keys(issues).length,
        configurable: true
      },
      "points": {
        value: sumIssuePoints(issues),
        configurable: true
      },
      "startDate": {
        value: getStartDate(sortedKeys[i].substring(0,sortedKeys[i].indexOf("-"))),
        configurable: true
      },
      "endDate": {
        value: getEndDate(sortedKeys[i].substring(0,sortedKeys[i].indexOf("-"))),
        configurable: true
      }
    });
    valuesToGraph.push(valueToGraph);
  }
  return valuesToGraph;
}

function getStartDate(sprintID) {
  var startDate = '';
  for(var i = 0; i < fullSprintsToProcess.length; i++){
    if(fullSprintsToProcess[i].id == sprintID){
      startDate = moment(fullSprintsToProcess[i].startDate).format('YYYY-MM-DD');
      break;
    }
  }
  return startDate;
}

function getEndDate(sprintID) {
  var endDate = '';
  for(var i = 0; i < fullSprintsToProcess.length; i++){
    if(fullSprintsToProcess[i].id == sprintID){
      endDate = moment(fullSprintsToProcess[i].endDate).format('YYYY-MM-DD');
      break;
    }
  }
  return endDate;
}

function sumIssuePoints(issuesToSum) {
  var summedPoints = 0;

  Object.keys(issuesToSum).forEach(function(key) {
    var sumIssue = issuesToSum[key];
    //this custom field ID is what JIRA has for story points
    if(sumIssue.fields.customfield_10019 && !isNaN(sumIssue.fields.customfield_10019)) {
      summedPoints += sumIssue.fields.customfield_10019;
    }
  });
  return summedPoints;
}

function getNameToIDSprintsMap() {
  var sprintMap = {};

  for (var i = 0; i < Object.keys(addedIssues).length; i++) {
    var sprintNameID = Object.keys(addedIssues)[i];
    sprintMap[sprintNameID.substring(sprintNameID.indexOf("-") + 1)] = sprintNameID.substring(0, sprintNameID.indexOf("-"));
  }
  return sprintMap;
}

function setStoriesAdded(currentProcessingSprint) {

  return new Promise(function(resolve, reject) {
    var sprintIssues = [];
    getIssuesForSprint(currentProcessingSprint.id, 0, sprintIssues).then(function(){
      addedIssues[currentProcessingSprint.id + "-" + currentProcessingSprint.name] = {};
      checkForAddedIssues(sprintIssues, currentProcessingSprint.id);
      resolve();
    });
  });
}

function getIssuesForSprint(sprintID, startAtIndex, sprintIssues) {
  var startAtString = '';
  if(typeof(startAtIndex) != undefined)
  {
    startAtString = '&startAt=' + startAtIndex;
  }

  return new Promise(function(resolve, reject) {
    AP.request({
      //future sprints are not needed
      url: '/rest/agile/1.0/sprint/' + sprintID + '/issue?expand=changelog&jql=parent=EMPTY&fields=changelog,sprint,created,closedSprints,creator,customfield_10019' + startAtString,
      success: function(response) {

        //First, check if there were multiple pages. If so, recursion until we got them all
        response = JSON.parse(response);
        if((response.startAt + 50) < response.total) {
          getIssuesForSprint(sprintID, (startAtIndex + 50), sprintIssues).then(function(){

            response.issues.forEach(function(issue) {
              sprintIssues.push(issue);
            })
            resolve(response);
          });
        }
        else {
          response.issues.forEach(function(issue) {
            sprintIssues.push(issue);
          })
          resolve(response);
        }
      },
      error: function() {
        console.log(arguments);
        reject(arguments);
      }
    });
  }).then();

}

function checkForAddedIssues(issues, currentProcessingSprintID) {

  for (var i = 0; i < issues.length; i++) {
    var issue = issues[i];

    /*there are 2 ways we have to check for added stories
     * If created after a sprint started and it's in a sprint
     * The latest changelog with a sprint modification added it to a sprint after the sprint was started*/
    checkActiveSprintAsPartOfCreation(issue, currentProcessingSprintID);
    checkClosedSprintAsPartOfCreation(issue, currentProcessingSprintID);
    checkAddedToActiveSprintAfterCreated(issue, currentProcessingSprintID);
    checkAddedToClosedSprintAfterCreated(issue, currentProcessingSprintID);
  }
}

function checkActiveSprintAsPartOfCreation(issue, currentProcessingSprintID) {
  if (issue.fields.sprint != null && issue.fields.sprint.id == currentProcessingSprintID) {
    checkSprintAsPartOfCreation(issue, issue.fields.sprint)
  }
}

function checkSprintAsPartOfCreation(issue, sprint) {
  //thanks JIRA for storing some dates in UTC and some in local time. sprint start date is stored UTC
  var timeZone = issue.fields.creator.timeZone;
  var createdTimestamp = moment(issue.fields.created).tz(timeZone);
  var sprintCreatedTimestamp = moment(sprint.startDate);
  if (createdTimestamp > sprintCreatedTimestamp) {
    addedIssues[sprint.id + "-" + sprint.name][issue.id] = issue;
  }
}

function checkClosedSprintAsPartOfCreation(issue, currentProcessingSprintID) {
  if (issue.fields.closedSprints != null) {
    for (var i = 0; i < issue.fields.closedSprints.length; i++) {
      if (issue.fields.closedSprints[i].id == currentProcessingSprintID) {
        checkSprintAsPartOfCreation(issue, issue.fields.closedSprints[i]);
      }
    }
  }
}

function checkAddedToActiveSprintAfterCreated(issue, currentProcessingSprintID) {
  if (issue.fields.sprint != null && issue.fields.sprint.id == currentProcessingSprintID) {
    checkAddedToSprintAfterCreated(issue, issue.fields.sprint);
  }
}

function checkAddedToSprintAfterCreated(issue, sprint) {
  var sprintName = sprint.name;
  var sprintStartDate = sprint.startDate;
  for (var i = 0; i < issue.changelog.histories.length; i++) {
    var currentHistory = issue.changelog.histories[i];
    for (var j = 0; j < currentHistory.items.length; j++) {
      var historyItem = currentHistory.items[j];
      var fieldChange = historyItem.field;
      if (fieldChange == "Sprint") {
        //thanks JIRA for storing some dates in UTC and some in local time. sprint start date is stored UTC
        var timeZone = currentHistory.author.timeZone;
        var timestampOfChange = moment(currentHistory.created).tz(timeZone);
        var sprintString = historyItem.toString;
        if (sprintString.includes(sprintName) && timestampOfChange > moment(sprintStartDate)) {
          addedIssues[sprint.id + "-" + sprint.name][issue.id] = issue;
          return;
        }
      }
    }
  }
}

function checkAddedToClosedSprintAfterCreated(issue, currentProcessingSprintID) {
  if (issue.fields.closedSprints != null) {
    for (var i = 0; i < issue.fields.closedSprints.length; i++) {
      if (issue.fields.closedSprints[i].id == currentProcessingSprintID) {
        checkAddedToSprintAfterCreated(issue, issue.fields.closedSprints[i]);
      }
    }
  }
}

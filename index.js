var _ = require('underscore'),
    fs = require('fs'),
    github = require('octonode'),
    Promise = require('promise');
    
var TEAMS = ['teampopong', 'peace-code', 'codeforseoul', 'codeforincheon', 'codenamu'];

var client = github.client({
  username: process.env['githubUsername'],
  password: process.env['githubPassword']
});

function getEventsByOrg (orgs_id) {
  return new Promise(function(fulfill, reject) {
    client.get('/orgs/' + orgs_id + '/events', {}, function (err, status, body, headers) {
      if (err) { return reject(err) };

      body = _.map(body, function (el) {
        var fixedEvent = {};
        flattenJson(el, fixedEvent);
        return fixedEvent;
      });

      fulfill(body);
    });
  });
}

function flattenJson (a, target) {
  for (key in a) {
    if(typeof a[key] == 'object') {
      flattenJson(a[key], target);
    } else {
      target[key] = a[key];
    }
  }
}

function writeEventsToCsv (events, file) {
  events.sort(function(a,b){return Number(new Date(b.created_at)) - Number(new Date(a.created_at));});
  _.each(events, function (event) {
    file.write(_.toArray(event).slice(0, 8).join(', ') + ', ' + event["created_at"] + '\n');
  });
  
  file.end();
}

function createCsvFile (teams) {
  var file = fs.createWriteStream("./community.csv");
  file.on('error', function (err) {});
  file.write("id, type, login, gravatar_id, url, avatar_url, name, push_id, created_at \n");

  Promise.all(TEAMS.map(getEventsByOrg))
    .done(function (result) {
      writeEventsToCsv(_.flatten(result), file);
    });
}

createCsvFile(TEAMS);

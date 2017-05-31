var parse;

$( document ).ready(function() {
  // Load the Visualization API and the corechart package.
  google.charts.load('current', {'packages':['corechart','geochart']});

  // Set a callback to run when the Google Visualization API is loaded.
  google.charts.setOnLoadCallback(drawChart);
});

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart() {
  // ID of the Google Spreadsheet
  var spreadsheetID = "1qFWojkhPcogBzULx0bEO7UEw1Uw9ke0lWF-EKSC2qhQ";
  var mapAPIkey = "AIzaSyAnn6o5Xcil9TjBRp1_TA_Ain0xE9TNPO4";
  // Make sure it is public or set to Anyone with link can view
  var url = "https://spreadsheets.google.com/feeds/list/" + spreadsheetID + "/od6/public/values?alt=json";

  var localStorageName = 'ppl-summit-json';

  console.log(url);

  $.ajax({
  dataType: "json",
  url: url,
  cache: true,
  success: function(json){
    google.visualization.mapsApiKey = mapAPIkey;
    parse = new Parse(json);

    // Stipends requested
    parse.makeChart('PieChart','money_stipen_request',{
      title:'Stipends Requested?',
      width:400,
      height:300
    }, function() {
      var totalYes = 0,
          totalNo = 0;

      parse.loopData(function(cell,i){
        var stipend = cell.gsx$stipendrequested.$t.toLowerCase();
        if (stipend === 'no' || stipend === '') {
          totalNo++;
        } else {
          totalYes++;
        }
      });

      return [['Stipend', 'Total'],
      ['yes', totalYes],
      ['no', totalNo]];

    });

    // Stipends by org
    parse.makeChart('BarChart','money_stipen_by_org',{
      title:'Stipends by Organization',
      width:600,
      height:400
    }, function() {
      var table = [['org','total','stipend requested']];

      parse.loopData(function(cell,i){
        var stipend = cell.gsx$stipendrequested.$t.toLowerCase();
        stipend = (stipend === 'no' || stipend === '') ? 0 : 1 ;

        var org = cell.gsx$organization.$t;
        if (org.toLowerCase() == 'unaffiliated') {
          return;
        }
        var unique = true;
        for (var j = 0; j < table.length; j++) {
          if (table[j][0].toLowerCase() == org.toLowerCase()) {
            table[j][1]++;
            unique = false;
            table[j][2] += stipend;
          }
        }
        if (unique) {
          table.push([org,0,stipend]);
        }
      });

      for (var i = 0; i < table.length; i++) {
        if (table[i][2] <= 0) {
          table.splice(i,1);
        }
      }

      return table;
    });

    // Stipends by state
    parse.makeChart('GeoChart','map_accepted_by_state',{
      region: 'US',
      resolution: 'provinces',
      width:600,
      height:400,
      colorAxis : {
          colors : ['ddecff','82b8ff','FFEE8D', 'FFE75F', 'FFE031','FFDC1A']
        },
    },function(){
      var table = [['State','Accepted','Applied']];

      parse.loopData(function(cell,i){
        var state = cell.gsx$state.$t;
        if (state.length > 2) {
          return;
        } else {
          state = "US-" + state.toUpperCase();
        }
        var accepted = (cell.gsx$accepted.$t == 'TRUE') ? 1 : 0 ;

        var unique = true;
        for (var j = 0; j < table.length; j++) {
          if (table[j][0] == state) {
            table[j][2]++;
            unique = false;
            table[j][1] += accepted;
          }
        }
        if (unique) {
          table.push([state,accepted,1]);
        }
      });

      return table;
    });

  }})
  .done(function() {
    $('.loading').hide();
    $('#main').show();
  })
  .fail(function() {
    console.log( "error" );
  })
  .always(function() {
    console.log( "complete" );
  });

}

function Parse(data) {
  this.data = data.feed.entry;
  // this.updated = data.updated.$t;
  this.columns = [];
  this.getColumns = function() {
    for (var k in this.data[0]) {
      if (k.startsWith('gsx$')) {
        this.columns.push(k);
      }
    }
  }
  this.getColumns();

  this.makeChart = function(chartType,target,options,callback) {
    var data, chart;
    data = google.visualization.arrayToDataTable(callback());
    switch (chartType) {
      case 'BarChart':
        chart = new google.visualization.BarChart(document.getElementById(target));
        break;
      case 'GeoChart':
        chart = new google.visualization.GeoChart(document.getElementById(target));
        break;
      default:
        chart = new google.visualization.PieChart(document.getElementById(target));
    }
    chart.draw(data, options);
  };

  this.loopData = function(callback) {
    for (var i = 0; i < this.data.length; i++) {
      callback(this.data[i],i);
    }
  };

  this.total = {};
  this.getTotals = function() {
    var running = [];
    for (var col of this.columns) {
      running[col] = { $total: 0 };
    }
    console.log(running);
    this.loopData(function(row,i){
      for (var col in row) {
        if (col in running) {
          var cell = row[col].$t;
          if (cell === '') {
            continue;
          }
          running[col].$total += 1;

          if (cell in running[col]){
            running[col][cell] += 1;
          } else {
            running[col][cell] = 1;
          }
        }
      }
    }); // end data loopData

    this.total = running;
  };
  this.getTotals();
}

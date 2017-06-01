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

  $.ajax({
  dataType: "json",
  url: url,
  cache: true,
  success: function(json){
    google.visualization.mapsApiKey = mapAPIkey;
    parse = new Parse(json);

    // Stipends requested
    parse.makeChart('PieChart','money_stipen_request',{
      width:400,
      height:300,
      pieSliceText: 'none',
      chartArea: {
        left: 30,
        width:'100%',
        height:'80%'
      },
      slices: {  1: {offset: 0.2} }
    }, function() {
      return [['Stipend', 'Total'],
      ['Yes', parse.total.gsx$stipendrequested.yes],
      ['No', parse.total.gsx$stipendrequested.no]];

    });

    // Stipends by org
    parse.makeChart('BarChart','money_stipen_by_org',{
      width:700,
      height:400,
      chartArea: {
        left: 280,
        right: 10,
        width:'90%',
        height:'80%'
      },
      legend: {
        position: 'none',
      }
    }, function() {
      var table = [['org','Application','Registered','Stipend Requested']];

      parse.loopData(function(cell,i){
        var stipend = cell.gsx$stipendrequested.$t.toLowerCase();
        stipend = (stipend === 'no' || stipend === '') ? 0 : 1 ;
        var registered = cell.gsx$registered.$t.toLowerCase();
        registered = (registered === 'true') ? 1 : 0;

        var org = cell.gsx$organization.$t;
        if (org.toLowerCase() == 'unaffiliated') {
          return;
        }
        var unique = true;
        for (var j = 0; j < table.length; j++) {
          if (table[j][0].toLowerCase() == org.toLowerCase()) {
            table[j][1]++;
            unique = false;
            table[j][2] += registered;
            table[j][3] += stipend;
          }
        }
        if (unique) {
          table.push([org,0,registered,stipend]);
        }
      });

      for (var i = 0; i < table.length; i++) {
        if (table[i][1] <= 0) {
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
      var table = [['State','Registered','Accepted']];

      parse.loopData(function(cell,i){
        var state = parse.cleanDataState(cell.gsx$state.$t);
        if (state.length > 2) {
          return;
        } else {
          state = "US-" + state.toUpperCase();
        }
        var accepted = (cell.gsx$accepted.$t == 'TRUE') ? 1 : 0 ;

        var registered = cell.gsx$registered.$t.toLowerCase();
        registered = (registered === 'true') ? 1 : 0;

        var unique = true;
        for (var j = 0; j < table.length; j++) {
          if (table[j][0] == state) {
            unique = false;
            table[j][2] += accepted;
            table[j][1] += registered;
          }
        }
        if (unique) {
          table.push([state,registered,accepted]);
        }
      });

      return table;
    });

    // Stipends requested
    parse.makeChart('PieChart','demo_age',{
      width:400,
      height:300,
      pieHole: 0.5,
      pieSliceText: 'none',
      legend: {
        position: 'labeled'
      },
      chartArea: {
        left: 30,
        width:'100%',
        height:'80%'
      }
    }, function() {
      var out = [['Age', 'Total']];
      var data = parse.total.gsx$age;
      for (var k in data) {
        if (k != '$total' && data.hasOwnProperty(k)) {
          out.push([k,data[k]]);
        }
      }
      return out;

    });

    // Stipends requested
    parse.makeChart('PieChart','demo_race',{
      width:400,
      height:300,
      pieHole: 0.5,
      pieSliceText: 'none',
      sliceVisibilityThreshold: 0.05,
      legend: {
        position: 'labeled'
      },
      chartArea: {
        left: 30,
        width:'100%',
        height:'80%'
      }
    }, function() {
      var out = [['Race', 'Total']];
      var data = parse.total.gsx$racialethnicidentity;
      var merge = [];
      for (var k in data) {
        if (k != '$total' && data.hasOwnProperty(k)) {
          if (k == 'White or European-American') {
            merge[0] = data[k];
          } else if (k == 'Black or African-American') {
            merge[1] = data[k];
          } else {
            out.push([k,data[k]]);
          }
        }
      }
      out['White or European-American'] = out['White or European-American'] + merge[0];
      out['Black or African American'] = out['Black or African American'] + merge[1];
      console.log(out);
      return out;
    });

  }})
  .done(function() {
    var total = parse.total;
    $('.loading').hide();
    $('#main').show();
    // last updated
    $('#updated').html( 'last updated: ' + parse.lastUpdated );
    $( "<p class='mb-0'>Total Applications:</p><h2 class='mt-0'>" + parse.data.length + "</h2>" ).appendTo('#totals');
    $( "<p class='mb-0'>Accepted:</p><h2 class='mt-0'>" + total.gsx$accepted.$total + "</h2>" ).appendTo('#totals');
    $( "<p class='mb-0'>Registered:</p><h2 class='mt-0'>" + total.gsx$registered.$total + "</h2>" ).appendTo('#totals');
  })
  .fail(function() {
    console.log( "error" );
  })
  .always(function() {
    console.log( "complete" );
  });

}

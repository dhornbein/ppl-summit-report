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
      var table = [['org','Application','Stipend Requested']];

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
        var state = parse.cleanDataState(cell.gsx$state.$t);
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

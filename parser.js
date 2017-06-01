function Parse(data) {
  this.data = data.feed.entry;
  this.updated = data.feed.updated.$t;
  this.lastUpdated = new Date(this.updated);
  this.entries = this.data;

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

  this.columns = [];
  this.getColumns = function() {
    for (var k in this.data[0]) {
      if (k.startsWith('gsx$')) {
        this.columns.push(k);
      }
    }
  };
  this.getColumns();

  this.loopData = function(callback) {
    for (var i = 0; i < this.data.length; i++) {
      callback(this.data[i],i);
    }
  };

  this.cleanCell = function(cell,column){
    var out,
        prefix = "gsx$";

    out = cell.$t.trim();

    switch (column) {
      case prefix + "state":
        out = this.cleanDataState(out);
        break;
      case prefix + "age":
        out = (out < 3) ? '' : out ;
        break;
      case prefix + "lgbtq":
      case prefix + "disabilities":
        if (out.toLowerCase().startsWith('no')) {
          out = 'no';
        } else if (out.toLowerCase().startsWith('prefer not to say')) {
          out = 'private';
        } else {
          out = 'yes';
        }
        break;
      case prefix + 'stipendrequested':
         out = (out.toLowerCase() == 'no') ? 'no' : 'yes';
        break;
      default:
      out = cell.$t.trim().replace('"','');

    }
    return (out === '') ? false : out ;
  };

  this.cleanDataState = function(data){
    var unknown = 'unknown';
    if (data.length == 2) {
      // if data is 2 characters and matches the list of abbriviations return it
      return (this.stateHash.abbr[data.toUpperCase()]) ? data.toUpperCase() : unknown ;
    } else if (data.length > 2) {
      if (this.stateHash.name[data.toLowerCase()]) {
        // if the data matches the state name return the abbriviation
        return this.stateHash.name[data.toLowerCase()];
      }
      if (this.stateHash.abbr[data.substring(0,2).toUpperCase()]) {
        // if the first 2 characters are state abbriviation
        return data.substring(0,2).toUpperCase();
      }
    }
    return unknown;
  };

  this.stateHash =
  {
    "name" : { "alabama": "AL","alaska": "AK","american samoa": "AS","arizona": "AZ","arkansas": "AR","california": "CA","colorado": "CO","connecticut": "CT","delaware": "DE","district of columbia": "DC","federated states of micronesia": "FM","florida": "FL","georgia": "GA","guam": "GU","hawaii": "HI","idaho": "ID","illinois": "IL","indiana": "IN","iowa": "IA","kansas": "KS","kentucky": "KY","louisiana": "LA","maine": "ME","marshall islands": "MH","maryland": "MD","massachusetts": "MA","michigan": "MI","minnesota": "MN","mississippi": "MS","missouri": "MO","montana": "MT","nebraska": "NE","nevada": "NV","new hampshire": "NH","new jersey": "NJ","new mexico": "NM","new york": "NY","north carolina": "NC","north dakota": "ND","northern mariana islands": "MP","ohio": "OH","oklahoma": "OK","oregon": "OR","palau": "PW","pennsylvania": "PA","puerto rico": "PR","rhode island": "RI","south carolina": "SC","south dakota": "SD","tennessee": "TN","texas": "TX","utah": "UT","vermont": "VT","virgin islands": "VI","virginia": "VA","washington": "WA","west virginia": "WV","wisconsin": "WI","wyoming": "WY"
  },
    "abbr": { 'AL': 'Alabama','ak': 'alaska','AS': 'american samoa','AZ': 'arizona','AR': 'arkansas','CA': 'california','CO': 'colorado','CT': 'connecticut','DE': 'delaware','DC': 'district of columbia','FM': 'federated states of micronesia','FL': 'florida','GA': 'georgia','GU': 'guam','HI': 'hawaii','ID': 'idaho','IL': 'illinois','IN': 'indiana','IA': 'iowa','KS': 'kansas','KY': 'kentucky','LA': 'louisiana','ME': 'maine','MH': 'marshall islands','MD': 'maryland','MA': 'massachusetts','MI': 'michigan','MN': 'minnesota','MS': 'mississippi','MO': 'missouri','MT': 'montana','NE': 'nebraska','NV': 'nevada','NH': 'new hampshire','NJ': 'new jersey','NM': 'new mexico','NY': 'new york','NC': 'north carolina','ND': 'north dakota','MP': 'northern mariana islands','OH': 'ohio','OK': 'oklahoma','OR': 'oregon','PW': 'palau','PA': 'pennsylvania','PR': 'puerto rico','RI': 'rhode island','SC': 'south carolina','SD': 'south dakota','TN': 'tennessee','TX': 'texas','UT': 'utah','VT': 'vermont','VI': 'virgin islands','VA': 'virginia','WA': 'washington','WV': 'west virginia','WI': 'wisconsin','WY': 'wyoming'
    }
  };

  this.total = {};
  this.getTotals = function() {
    var self = this,
        running = [];
    for (var col of this.columns) {
      running[col] = { $total: 0 };
    }
    this.loopData(function(row,i){
      // loop columns
      for (var col in row) {
        // if column is column header
        if (col in running) {
          // clean cell
          var cell = self.cleanCell(row[col],col);
          // if cell is false, skip it
          if (!cell) {
            continue;
          }
          // add to total
          running[col].$total += 1;

          //
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

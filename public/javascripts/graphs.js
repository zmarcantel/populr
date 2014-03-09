var Keen=Keen||{configure:function(e){this._cf=e},addEvent:function(e,t,n,i){this._eq=this._eq||[],this._eq.push([e,t,n,i])},setGlobalProperties:function(e){this._gp=e},onChartsReady:function(e){this._ocrq=this._ocrq||[],this._ocrq.push(e)}};(function(){var e=document.createElement("script");e.type="text/javascript",e.async=!0,e.src=("https:"==document.location.protocol?"https://":"http://")+"dc8na2hxrj29i.cloudfront.net/code/keen-2.1.0-min.js";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)})();

//
// keen.io provides a library that self-downlaods via JSONP
// above, we get that library and immediately below we configure it
// the projectId/keys are the same as provided in 'app.js'
//
Keen.configure({
      projectId: analytics.identifier
    , readKey: analytics.keys.read
});


//
// this is a 'branching function' that calls all the sections
// the first being total, then weekly, then line graphs, etc
//
Keen.onChartsReady(function(){
    totalNumbers();
    weeklyNumbers();
    weeklyTimeSeries();
    devicePies();
});


//
// Get the running numbers
//
function totalNumbers() {
    //
    // Total number of redirects ever
    //
    var total = new Keen.Metric("redirect", {
        analysisType: "count",
        timeframe: "this_week",
    });
    if (token.length) { total.addFilter("token", "eq", token); }
    var totalNumber = new Keen.Number(total, {
        label: "Total Redirects",
        "border-radius": 5
    });
    totalNumber.draw(document.getElementById("total-all"));


    //
    // Total number of unique pages ever redirected to
    //
    var pages = new Keen.Metric("redirect", {
        analysisType: "count_unique",
        targetProperty: "redirect",
        timeframe: "this_week",
    });
    if (token.length) { pages.addFilter("token", "eq", token); }
    var pagesNumber = new Keen.Number(pages, {
        label: "Unique Destinations",
        "border-radius": 5
    });
    pagesNumber.draw(document.getElementById("pages-all"));


    //
    // Total number of unique vewers ever
    //
    var uniques = new Keen.Metric("redirect", {
        analysisType: "count_unique",
        targetProperty: "uniqueId",
        timeframe: "this_week",
    });
    if (token.length) { uniques.addFilter("token", "eq", token); }
    var uniquesNumber = new Keen.Number(uniques, {
        label: "Unique Viewers",
        "border-radius": 5
    });
    uniquesNumber.draw(document.getElementById("uniques-all"));


    //
    // Total number of browsers encountered
    //
    var browsers = new Keen.Metric("redirect", {
        analysisType: "count_unique",
        targetProperty: "device.browser",
        timeframe: "this_week",
    });
    if (token.length) { browsers.addFilter("token", "eq", token); }
    var browsersNumber = new Keen.Number(browsers, {
        label: "Browsers",
        "border-radius": 5
    });
    browsersNumber.draw(document.getElementById("browser-all"));
}



//
// Get the numbers for the past week
//
function weeklyNumbers() {
    //
    // Number of redirects in the last week
    //
    var totalWeek = new Keen.Metric("redirect", {
        analysisType: "count",
        timeframe: "this_week",
    });
    if (token.length) { totalWeek.addFilter("token", "eq", token); }
    var totalWeekNumber = new Keen.Number(totalWeek, {
        label: "Total Redirects",
        "border-radius": 5
    });
    totalWeekNumber.draw(document.getElementById("total-week"));


    //
    // Number of unique pages redirected to in the last week
    //
    var pagesWeek = new Keen.Metric("redirect", {
        analysisType: "count_unique",
        targetProperty: "redirect",
        timeframe: "this_week",
    });
    if (token.length) { pagesWeek.addFilter("token", "eq", token); }
    var pagesWeekNumber = new Keen.Number(pagesWeek, {
        label: "Unique Destinations",
        "border-radius": 5
    });
    pagesWeekNumber.draw(document.getElementById("pages-week"));


    //
    // Unique viewers in the past week
    //
    var uniquesWeek = new Keen.Metric("redirect", {
        analysisType: "count_unique",
        targetProperty: "uniqueId",
        timeframe: "this_week",
    });
    if (token.length) { uniquesWeek.addFilter("token", "eq", token); }

    // draw the output
    var uniquesWeekNumber = new Keen.Number(uniquesWeek, {
        label: "Unique Viewers",
        "border-radius": 5
    });
    uniquesWeekNumber.draw(document.getElementById("uniques-week"));


    //
    // Number of browsers encountered in the last week
    //
    var browsersWeek = new Keen.Metric("redirect", {
        analysisType: "count_unique",
        targetProperty: "device.browser",
        timeframe: "this_week",
    });
    if (token.length) { browsersWeek.addFilter("token", "eq", token); }

    // draw the output
    var browsersWeekNumber = new Keen.Number(browsersWeek, {
        label: "Browsers",
        "border-radius": 5
    });
    browsersWeekNumber.draw(document.getElementById("browser-week"));
}



//
// Get the time series graphs for the past week
//
function weeklyTimeSeries() {
    //
    // Get the daily views over the last week
    // This could either be for a specific token or all of them
    //
    var tokenViewsChart;
    var tokenViews = new Keen.Series("redirect", {
        analysisType: "count",
        timeframe: "this_week",
        interval: "daily",
        groupBy: token.length ? undefined : 'token'
    });
    if (token.length) {
        tokenViews.addFilter("token", "eq", token);
        tokenViewsChart = new Keen.LineChart(tokenViews, {
            width: '100%',
            height: '30%',
            lineWidth: 5,
            backgroundColor: "transparent",
            label: 'views',
            title: "Token views over the past week",
        });
    } else {
        //Draw a multi line chart in a <div/> with an ID of "purchases"
        tokenViewsChart = new Keen.MultiLineChart(tokenViews, {
            width: '100%',
            height: '30%',
            lineWidth: 5,
            backgroundColor: "transparent",
            title: "Token views over the past week",
        });
    }
    tokenViewsChart.draw(document.getElementById("token-views"));
    $('#token-views svg')
        .attr('preserveAspectRatio', 'xMaxYMax meet')
        .attr('viewBox', '0 0 ' + $('#token-views-week').width() + ' ' + $('#token-views-week').height());


    //
    // Get the daily unique viewrs for the past week
    // This could either be for a specific token or all of them
    //
    var tokenUniqueViewsChart;
    var tokenUniqueViews = new Keen.Series("redirect", {
        analysisType: "count_unique",
        targetProperty: "uniqueId",
        timeframe: "this_week",
        interval: "daily",
        groupBy: token.length ? undefined : 'token'
    });
    if (token.length) {
        tokenUniqueViews.addFilter("token", "eq", token);
        tokenUniqueViewsChart = new Keen.LineChart(tokenUniqueViews, {
           width: '100%',
           height: '30%',
           lineWidth: 5,
           backgroundColor: "transparent",
           label: 'unique views',
           title: "Unique viewers in the past week",
       });
    } else {
        tokenUniqueViewsChart = new Keen.MultiLineChart(tokenUniqueViews, {
           width: '100%',
           height: '30%',
           lineWidth: 5,
           backgroundColor: "transparent",
           title: "Unique viewers of a token on a given day in the past week",
       });
    }
    tokenUniqueViewsChart.draw(document.getElementById("token-unique-views"));
    $('#token-unique-views svg')
        .attr('preserveAspectRatio', 'xMaxYMax meet')
        .attr('viewBox', '0 0 ' + $('#token-unique-views').width() + ' ' + $('#token-unique-views').height());


    //
    // Get the number of distinct pages redirected to in the past week
    // This chart does not appear in a single-token page
    //
    var urlViewsChart;
    var urlViews = new Keen.Series("redirect", {
        analysisType: "count_unique",
        targetProperty: "redirect",
        timeframe: "this_week",
        interval: "daily",
        groupBy: "redirect"
    });
    if (token.length === 0) {
        urlViewsChart = new Keen.MultiLineChart(urlViews, {
           width: '100%',
           height: '30%',
           lineWidth: 5,
           backgroundColor: "transparent",
           title: "Distinct URL view count in the past week",
       });
       urlViewsChart.draw(document.getElementById("url-views"));
   } else {
       console.log($('#url-views-week'));
       $('#url-views-week').attr('style', 'display:none !important;');
   }
}


//
// Get the pie charts describing device usage
//
function devicePies() {
    //
    // Pie chart of the OSs encountered
    //
    var osPie = new Keen.Metric("redirect", {
        analysisType: "count",
        targetProperty: "device.os",
        groupBy: "device.os"
    });
    if (token.length) {
        osPie.addFilter("token", "eq", token);
    }
    var osPieChart = new Keen.PieChart(osPie, {
        height: '100%',
        width: '100%',
        minimumSlicePercentage: 1,
        backgroundColor: "transparent",
        title: "OS Spread",
    });
    osPieChart.draw(document.getElementById("os-pie"));
    $('#os-pie')
        .attr('preserveAspectRatio', 'xMaxYMax meet')
        .attr('viewBox', '0 0 ' + $('#os-pie').width() + ' ' + $('#os-pie').height());


    //
    // Pie chart of the OS versions envountered
    //
    var osVersionPie = new Keen.Metric("redirect", {
        analysisType: "count",
        targetProperty: "device.osVersion",
        groupBy: "device.osVersion"
    });
    if (token.length) {
        osVersionPie.addFilter("token", "eq", token);
    }
    var osVersionPieChart = new Keen.PieChart(osVersionPie, {
        height: '100%',
        width: '100%',
        minimumSlicePercentage: 5,
        backgroundColor: "transparent",
        title: "OS Version Spread",
    });
    osVersionPieChart.draw(document.getElementById("os-version-pie"));
    $('#os-version-pie')
        .attr('preserveAspectRatio', 'xMaxYMax meet')
        .attr('viewBox', '0 0 ' + $('#os-version-pie').width() + ' ' + $('#os-version-pie').height());


    //
    // Pie chart of the browsers encountered
    //
    var browserPie = new Keen.Metric("redirect", {
        analysisType: "count",
        targetProperty: "device.browser",
        groupBy: "device.browser"
    });
    if (token.length) {
        browserPie.addFilter("token", "eq", token);
    }
    var browserPieChart = new Keen.PieChart(browserPie, {
        height: '100%',
        width: '100%',
        minimumSlicePercentage: 5,
        backgroundColor: "transparent",
        title: "Browser Spread",
    });
    browserPieChart.draw(document.getElementById("browser-pie"));
    $('#browser-pie')
        .attr('preserveAspectRatio', 'xMaxYMax meet')
        .attr('viewBox', '0 0 ' + $('#browser-pie').width() + ' ' + $('#browser-pie').height());


    //
    // Pie chart of the browser versions encountered
    //
    var browserVersionPie = new Keen.Metric("redirect", {
        analysisType: "count",
        targetProperty: "device.browserVersion",
        groupBy: "device.browserVersion"
    });
    if (token.length) {
        browserVersionPie.addFilter("token", "eq", token);
    }
    var browserVersionPieChart = new Keen.PieChart(browserVersionPie, {
        height: '100%',
        width: '100%',
        minimumSlicePercentage: 5,
        backgroundColor: "transparent",
        title: "Browser Version Spread",
        minimumSlicePercentage: 1
    });
    browserVersionPieChart.draw(document.getElementById("browser-version-pie"));
    $('#browser-version-pie')
        .attr('preserveAspectRatio', 'xMaxYMax meet')
        .attr('viewBox', '0 0 ' + $('#browser-version-pie').width() + ' ' + $('#browser-version-pie').height());
}

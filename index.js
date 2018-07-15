    
      // DEFINE VARIABLES
      // Define size of map group
      // Full world map is 2:1 ratio
      // Using 12:5 because we will crop top and bottom of map
      w = 1400;
      h = 1000;
      // variables for catching min and max zoom factors
      var minZoom;
      var maxZoom;

      var refugeedata = []

      var isCountry = false;

      // DEFINE FUNCTIONS/OBJECTS
      // Define map projection
      var projection = d3
      .geoMercator()
        .center([0, 35]) // set centre to further North as we are cropping more off bottom of map
        .scale([w / (2 * Math.PI)]) // scale to fit group width
        .translate([w / 2, h / 2]) // ensure centred in group
        ;

      // Define map path
      var path = d3
      .geoPath()
      .projection(projection)
      ;

      // Create function to apply zoom to countriesGroup
      function zoomed() {
        t = d3
        .event
        .transform
        ;
        countriesGroup
        .attr("transform","translate(" + [t.x, t.y] + ")scale(" + t.k + ")")
        ;
      }

      // Define map zoom behaviour
      var zoom = d3
      .zoom()
      .on("zoom", zoomed)
      ;

      function getTextBox(selection) {
        selection
        .each(function(d) {
          d.bbox = this
          .getBBox();
        })
        ;
      }

      // Function that calculates zoom/pan limits and sets zoom to default value 
      function initiateZoom() {
        // Define a "minzoom" whereby the "Countries" is as small possible without leaving white space at top/bottom or sides
        minZoom = Math.max($("#map-holder").width() / w, $("#map-holder").height() / h);
        // set max zoom to a suitable factor of this value
        maxZoom = 20 * minZoom;
        // set extent of zoom to chosen values
        // set translate extent so that panning can't cause map to move out of viewport
        zoom
        .scaleExtent([minZoom, maxZoom])
        .translateExtent([[0, 0], [w, h]])
        ;
        // define X and Y offset for centre of map to be shown in centre of holder
        midX = ($("#map-holder").width() - minZoom * w) / 2;
        midY = ($("#map-holder").height() - minZoom * h) / 2;
        // change zoom transform to min zoom and centre offsets
        svg.call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));
      }

      // zoom to show a bounding box, with optional additional padding as percentage of box size
      function boxZoom(box, centroid, paddingPerc) {
        minXY = box[0];
        maxXY = box[1];
        // find size of map area defined
        zoomWidth = Math.abs(minXY[0] - maxXY[0]);
        zoomHeight = Math.abs(minXY[1] - maxXY[1]);
        // find midpoint of map area defined
        zoomMidX = centroid[0];
        zoomMidY = centroid[1];
        // increase map area to include padding
        zoomWidth = zoomWidth * (1 + paddingPerc / 100);
        zoomHeight = zoomHeight * (1 + paddingPerc / 100);
        // find scale required for area to fill svg
        maxXscale = $("svg").width() / zoomWidth;
        maxYscale = $("svg").height() / zoomHeight;
        zoomScale = Math.min(maxXscale, maxYscale);
        // handle some edge cases
        // limit to max zoom (handles tiny countries)
        zoomScale = Math.min(zoomScale, maxZoom);
        // limit to min zoom (handles large countries and countries that span the date line)
        zoomScale = Math.max(zoomScale, minZoom);
        // Find screen pixel equivalent once scaled
        offsetX = zoomScale * zoomMidX;
        offsetY = zoomScale * zoomMidY;
        // Find offset to centre, making sure no gap at left or top of holder
        dleft = Math.min(0, $("svg").width() / 2 - offsetX);
        dtop = Math.min(0, $("svg").height() / 2 - offsetY);
        // Make sure no gap at bottom or right of holder
        dleft = Math.max($("svg").width() - w * zoomScale, dleft);
        dtop = Math.max($("svg").height() - h * zoomScale, dtop);
        // set zoom
        svg
        .transition()
        .duration(500)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale)
          );
      }


      // on window resize
      $(window).resize(function() {
        // Resize SVG
        svg
        .attr("width", $("#map-holder").width())
        .attr("height", $("#map-holder").height())
        ;
        initiateZoom();
      });

      // create an SVG
      var svg = d3
      .select("#map-holder")
      .append("svg")
        // set to the same size as the "map-holder" div
        .attr("width", $("#map-holder").width())
        .attr("height", $("#map-holder").height())
        // add zoom functionality
        .call(zoom);

        var originsvg = d3
        .select("#origin")
        .append("svg")
        .attr("width", $("#origin").width())
        .attr("height", $("#origin").height())



        var destinationsvg = d3
        .select("#destination")
        .append("svg")
        .attr("width", $("#destination").width())
        .attr("height", $("#destination").height())

        var origintitle = originsvg.append("text")
        .attr("class","bar-title")
        .attr("transform","translate(" + ($("#destination").width()/2)+ ",40)")
        .text("")

        var destinationtitle = destinationsvg.append("text")
        .attr("class","bar-title")
        .attr("transform","translate(" + ($("#destination").width()/2)+ ",40)")
        .text("")



        d3.queue()
        .defer(d3.json, 'custom.json')
        .defer(d3.csv, 'refugees.csv')
        .await(function(error, json, csv){
          if (error){
            console.error('error loading')
          }
          else {

            destinationtitle.text("Refugee host countries")
            origintitle.text("Refugee origin countries")



            refugeedata = csv
            countriesGroup = svg.append("g").attr("id", "map");
          // add a background rectangle
          countriesGroup
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", w)
          .attr("height", h);

          // draw a path for each feature/country
          countries = countriesGroup
          .selectAll("path")
          .data(json.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("id", function(d, i) {
            return "country" + d.properties.iso_a3;
          })
          .attr("class", "country")
      //      .attr("stroke-width", 10)
      //      .attr("stroke", "#ff0000")
            // add a mouseover action to show name label for feature/country
            .on("mouseover", function(d, i) {
              d3.select("#countryLabel" + d.properties.iso_a3).style("display", "block");
            })
            .on("mouseout", function(d, i) {
              d3.select("#countryLabel" + d.properties.iso_a3).style("display", "none");
            })
            // add an onclick action to zoom into clicked country
            .on("click", function(d, i) {
              isCountry = true
              var country = d.properties.name
              createBar(country)
              d3.selectAll(".country").classed("country-on", false);
              d3.select(this).classed("country-on", true);
            // boxZoom(path.bounds(d), path.centroid(d), 20);
          });
          // Add a label group to each feature/country. This will contain the country name and a background rectangle
          // Use CSS to have class "countryLabel" initially hidden

          countryLabels = countriesGroup
          .selectAll("g")
          .data(json.features)
          .enter()
          .append("g")
          .attr("class", "countryLabel")
          .attr("id", function(d) {
            return "countryLabel" + d.properties.iso_a3;
          })
          .attr("transform", function(d) {
            return (
              "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")"
              );
          })
            // add mouseover functionality to the label
            .on("mouseover", function(d, i) {
              d3.select(this).style("display", "block");
            })
            .on("mouseout", function(d, i) {
             d3.select(this).style("display", "none");
           })
            // add an onlcick action to zoom into clicked country
            .on("click", function(d, i) {
              isCountry = true
              var country = d.properties.name
              createBar(country)
              d3.selectAll(".country").classed("country-on", false);
              d3.select("#country" + d.properties.iso_a3).classed("country-on", true);
              // boxZoom(path.bounds(d), path.centroid(d), 20);
            });
          // add the text to the label group showing country name
          countryLabels
          .append("text")
          .attr("class", "countryName")
          .style("text-anchor", "middle")
          .attr("dx", 0)
          .attr("dy", 0)
          .text(function(d) {
            return d.properties.name;
          })
          .call(getTextBox);
          // add a background rectangle the same size as the text
          countryLabels
          .insert("rect", "text")
          .attr("class", "countryLabelBg")
          .attr("transform", function(d) {
            return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
          })
          .attr("width", function(d) {
            return d.bbox.width + 4;
          })
          .attr("height", function(d) {
            return d.bbox.height;
          });
          initiateZoom();
          createDefault();

          countriesGroup.on("click", function() {
            if (isCountry == false) {
              d3.selectAll(".country").classed("country-on", false);
              createDefault()
              destinationtitle.text("Countries of Asylum - Global")
              origintitle.text("Countries of Origin - Global")
            }

            isCountry = false
          })


        }
      })

    function createDefault(){

      originsvg.selectAll("g").remove()
      destinationsvg.selectAll("g").remove()
      var countryPairTotals = refugeedata.filter(function(d) {return d["Type of population"] == "Total Refugee and people in refugee-like situations"})
      var originTotals = d3.nest().key(function(d) {return d.Origin}).rollup(function(v) {return d3.sum(v, function(d) {return d.Population})}).entries(countryPairTotals)
      var destinationTotals = d3.nest().key(function(d) {return d["Country/territory of asylum/residence"]}).rollup(function(v) {return d3.sum(v, function(d) {return d.Population})}).entries(countryPairTotals)

      originTotals.sort(function(a,b) {
        return +b.value - +a.value})

      destinationTotals.sort(function(a,b) {
        return +b.value - +a.value})

      var destinationBarData = destinationTotals.slice(0,10)
      var originBarData = originTotals.slice(0,10)


      drawCountryCharts(destinationBarData, originBarData)

    }

    function createBar(country) {

      origintitle.text(country + " hosts refugees from..")
      destinationtitle.text("Refugees from "+country+" are hosted in..")

      originsvg.selectAll("g").remove()
      destinationsvg.selectAll("g").remove()

      if (map_to_unhrc[country]!== undefined){
        country = map_to_unhrc[country]
      }

      var destinationcountryData = refugeedata.filter(function(d) {return d["Origin"] == country && d["Population"] > 0})
      var destinationTotalData = destinationcountryData.filter(function(d) {return d["Type of population"] == "Total Refugee and people in refugee-like situations"})
      destinationTotalData.sort(function(a,b) {
        return +b["Population"] - +a["Population"]})
      var destinationBarData = destinationTotalData.slice(0,10)

      destinationBarData = d3.nest().key(function(d) {return d["Country/territory of asylum/residence"]}).rollup(function(v) {return d3.sum(v, function(d) {return d.Population})}).entries(destinationBarData)



      var origincountryData = refugeedata.filter(function(d) {return d["Country/territory of asylum/residence"] == country && d["Population"] > 0})
      var originTotalData = origincountryData.filter(function(d) {return d["Type of population"] == "Total Refugee and people in refugee-like situations"})
      originTotalData.sort(function(a,b) {
        return +b["Population"] - +a["Population"]})
      var originBarData = originTotalData.slice(0,10)

      originBarData = d3.nest().key(function(d) {return d.Origin}).rollup(function(v) {return d3.sum(v, function(d) {return d.Population})}).entries(originBarData)

      drawCountryCharts(destinationBarData, originBarData)

    }


    function drawCountryCharts(destinationBarData, originBarData) {


      var originx = d3.scaleLinear().rangeRound([0,250]).domain([0,d3.max(originBarData, function(d) {return +d["value"]})]).nice()
      originy = d3.scaleBand().range([0,360]).padding(0.1).domain(originBarData.map(function(d) {return d["key"]})),
      origing = originsvg.append("g").attr("transform","translate(" +100 + "," + 70 + ")");

      origing.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + 0 + ")")
      .call(d3.axisTop(originx).ticks(3));

      origing.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(originy).tickSize(0))
      .selectAll(".tick text")
      .call(wrap, 100)

      origing.selectAll(".bar")
      .data(originBarData)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", function(d) { return originy(d["key"]); })
      .attr("height", originy.bandwidth())
      .attr("width", function(d) { return originx(d["value"]); })
      .on("click", function(d) {
        createBar(d.key)
        d3.selectAll(".country").classed("country-on", false);
        d3.select("#country" + d.properties.iso_a3).classed("country-on", true);
      });


      var destinationx = d3.scaleLinear().rangeRound([0,250]).domain([0,d3.max(destinationBarData, function(d) {return +d["value"]})]).nice()
      destinationy = d3.scaleBand().range([0,360]).padding(0.1).domain(destinationBarData.map(function(d) {return d["key"]})),
      destinationg = destinationsvg.append("g").attr("transform","translate(" +100 + "," + 70 + ")");

      destinationg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + 0 + ")")
      .call(d3.axisTop(destinationx).ticks(3));

      destinationg.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(destinationy).tickSize(0))
      .selectAll(".tick text")
      .call(wrap, 100);

      destinationg.selectAll(".bar")
      .data(destinationBarData)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", function(d) { return destinationy(d["key"]); })
      .attr("height", destinationy.bandwidth())
      .attr("width", function(d) { return destinationx(d["value"]); })
      .on("click", function(d) {
        createBar(d.key)
        d3.selectAll(".country").classed("country-on", false);
        d3.select("#country" + d.properties.iso_a3).classed("country-on", true);
      });

    }


    var unhrc_to_map = {
      "Antigua and Barbuda" :"Antigua and Barb.",
      "Bolivia (Plurinational State of)" :"Bolivia",
      "Bosnia and Herzegovina" :"Bosnia and Herz.",
      "British Virgin Islands" :"British Virgin Is.",
      "Brunei Darussalam" :"Brunei",
      "Côte d'Ivoire" :"Ivory Coast",
      "Cabo Verde" :"Cape Verde",
      "Cayman Islands" :"Cayman Is.",
      "China, Hong Kong SAR" :"Hong Kong",
      "China, Macao SAR" :"Macao",
      "Congo, Republic of" :"Congo",
      "Cook Islands" :"Cook Is.",
      "Curaçao" :"",
      "Czechia" :"Czech Rep.",
      "Dem. People's Rep. of Korea" :"Dem. Rep. Korea",
      "Dem. Rep. of the Congo" :"Dem. Rep. Congo",
      "Equatorial Guinea" :"Eq. Guinea",
      "French Guiana" :"",
      "Gibraltar" :"",
      "Guadeloupe" :"",
      "Iran (Islamic Rep. of)" :"Iran",
      "Lao People's Dem. Rep." :"Lao PDR",
      "Maldives" :"",
      "Marshall Islands" :"Marshall Is.",
      "Mauritius" :"",
      "Micronesia (Federated States of)" :"Micronesia",
      "Palestinian" :"Palestine",
      "Rep. of Korea" :"Korea",
      "Rep. of Moldova" :"Moldova",
      "Russian Federation" :"Russia",
      "Saint Kitts and Nevis" :"St. Kitts and Nevis",
      "Saint Vincent and the Grenadines" :"St. Vin. and Gren.",
      "Saint-Pierre-et-Miquelon" :"St. Pierre and Miquelon",
      "Sao Tome and Principe" :"",
      "Serbia and Kosovo: S/RES/1244 (1999)" :"Serbia",
      "Seychelles" :"",
      "Sint Maarten (Dutch part)" :"",
      "Solomon Islands" :"Solomon Is.",
      "South Sudan" :"S. Sudan",
      "Stateless" :"",
      "Syrian Arab Rep." :"Syria",
      "The former Yugoslav Republic of Macedonia" :"Macedonia",
      "Tibetan" :"",
      "Turks and Caicos Islands" :"Turks and Caicos Is.",
      "Tuvalu" :"",
      "United Rep. of Tanzania" :"Tanzania",
      "United States of America" :"United States",
      "Various" :"",
      "Venezuela (Bolivarian Republic of)" :"Venezuela",
      "Viet Nam" :"Vietnam",
      "Wallis and Futuna Islands " :"Wallis and Futuna Is.",
      "Western Sahara" :"W. Sahara"
    }


    var map_to_unhrc = {
      "Antigua and Barb." :"Antigua and Barbuda",
      "Bolivia" :"Bolivia (Plurinational State of)",
      "Bosnia and Herz." :"Bosnia and Herzegovina",
      "British Virgin Is." :"British Virgin Islands",
      "Brunei" :"Brunei Darussalam",
      "Ivory Coast" :"Côte d'Ivoire",
      "Cape Verde" :"Cabo Verde",
      "Cayman Is." :"Cayman Islands",
      "Hong Kong" :"China, Hong Kong SAR",
      "Macao" :"China, Macao SAR",
      "Congo" :"Congo, Republic of",
      "Cook Is." :"Cook Islands",
      "" :"Curaçao",
      "Czech Rep." :"Czechia",
      "Dem. Rep. Korea" :"Dem. People's Rep. of Korea",
      "Dem. Rep. Congo" :"Dem. Rep. of the Congo",
      "Eq. Guinea" :"Equatorial Guinea",
      "" :"French Guiana",
      "" :"Gibraltar",
      "" :"Guadeloupe",
      "Iran" :"Iran (Islamic Rep. of)",
      "Lao PDR" :"Lao People's Dem. Rep.",
      "" :"Maldives",
      "Marshall Is." :"Marshall Islands",
      "" :"Mauritius",
      "Micronesia" :"Micronesia (Federated States of)",
      "Palestine" :"Palestinian",
      "Korea" :"Rep. of Korea",
      "Moldova" :"Rep. of Moldova",
      "Russia" :"Russian Federation",
      "St. Kitts and Nevis" :"Saint Kitts and Nevis",
      "St. Vin. and Gren." :"Saint Vincent and the Grenadines",
      "St. Pierre and Miquelon" :"Saint-Pierre-et-Miquelon",
      "" :"Sao Tome and Principe",
      "Serbia" :"Serbia and Kosovo: S/RES/1244 (1999)",
      "" :"Seychelles",
      "" :"Sint Maarten (Dutch part)",
      "Solomon Is." :"Solomon Islands",
      "S. Sudan" :"South Sudan",
      "" :"Stateless",
      "Syria" :"Syrian Arab Rep.",
      "Macedonia" :"The former Yugoslav Republic of Macedonia",
      "" :"Tibetan",
      "Turks and Caicos Is." :"Turks and Caicos Islands",
      "" :"Tuvalu",
      "Tanzania" :"United Rep. of Tanzania",
      "United States" :"United States of America",
      "" :"Various",
      "Venezuela" :"Venezuela (Bolivarian Republic of)",
      "Vietnam" :"Viet Nam",
      "Wallis and Futuna Is." :"Wallis and Futuna Islands ",
      "W. Sahara" :"Western Sahara"
    }


    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = 0,
        dy = 0,
        // y = text.attr("y"),
        // dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", -5).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", -5).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }


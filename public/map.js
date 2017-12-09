/** 
 * 
 * http://bl.ocks.org/tomschulze/961d57bd1bbd2a9ef993f2e8645cb8d2
 * 
 * 
*/

//Map dimensions (in pixels)
var width = parseInt(d3.select('#map').style('width'))
var height = width / 2

//Map projection
var projection = d3.geoMercator()
    .scale(200) // Default is 150.
    .center([-0.000012202536046070683, 11.412386285750163]) //projection center
    .translate([width / 2, height / 2]) //translate to center the map in view

//Generate paths based on projection
var path = d3.geoPath()
    .projection(projection)

//Create an SVG
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)

//Group for the map features
var features = svg.append("g")
    .attr("class", "features")

//Create a tooltip, hidden at the start
var tooltip = d3.select("body").append("div").attr("class", "tooltip");

//Keeps track of currently zoomed feature
var centered;

// Colour mapper
var color = d3.scaleQuantile()
    .domain([0,100000000])
    .range(d3.schemeBlues[9])

// Variable for storing data
var aidData = {}
var year = 2016

d3.queue()
    .defer(d3.json, "world.topojson")
    .defer(d3.csv, "./api/countries.csv", (d) => {
        let keys = Object.keys(d)
        // Get only years
        keys = keys.filter(x => (x.length === 4 && parseInt(x)) )
        // Add data to object
        const yearObj = keys.reduce((obj, year) => {
            obj[year] = d[year]
            return obj
        },{})

        aidData[d.code] = yearObj
    })
    .await(ready);

function ready(error, geodata) {
    if (error) return console.log(error) //unknown error, check the console
    //Create a path for each map feature in the data
    features.selectAll("path")
        .data(topojson.feature(geodata, geodata.objects.countries1).features) //generate features from TopoJSON
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "grey")
        .attr("fill", (d) => {
            const code = d.properties['Alpha-2']
            const value = getAid(aidData, code, year)

            return (value > 0) ? color(value) : "lightgrey"
            // fillColor = color(value)

            // return fillColor
            // return 'blue'
        })
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip)
        .on("click", clicked);
}

function getAid(data, code, year){
    // If country doesn't exist in data, set the value to zero
     return data[code] ? data[code][year] : 0
    
}
// Zoom to feature on click
function clicked(d, i) {

    //Add any other onClick events here

    var x, y, k;

    if (d && centered !== d) {
        // Compute the new map center and scale to zoom to
        var centroid = path.centroid(d);
        var b = path.bounds(d);
        x = centroid[0];
        y = centroid[1];
        k = .8 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
        centered = d
    } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        centered = null;
    }

    // Highlight the new feature
    features.selectAll("path")
        .classed("highlighted", function (d) {
            return d === centered;
        })
        .style("stroke-width", 1 / k + "px"); // Keep the border width constant

    //Zoom and re-center the map
    //Uncomment .transition() and .duration() to make zoom gradual
    features
        //.transition()
        //.duration(500)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
}


//Position of the tooltip relative to the cursor
var tooltipOffset = { x: 5, y: -25 };

//Create a tooltip, hidden at the start
function showTooltip(d) {
    moveTooltip();

    tooltip.style("display", "block")
        .text(d.properties.name + " " + getAid(aidData, d.properties['Alpha-2'], year).toLocaleString());
}

//Move the tooltip to track the mouse
function moveTooltip() {
    tooltip.style("top", (d3.event.pageY + tooltipOffset.y) + "px")
        .style("left", (d3.event.pageX + tooltipOffset.x) + "px");
}

//Create a tooltip, hidden at the start
function hideTooltip() {
    tooltip.style("display", "none");
}
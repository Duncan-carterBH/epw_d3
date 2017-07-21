/*-------------------------------------------------------------------------
 * epwCharts.js
 * Chart library for epwvis
 *
 * DEPENDENCIES
 *  - d3.js
 *-------------------------------------------------------------------------*/

function clearEPWChartsSimple() {
    d3.selectAll("svg").remove();
};

function epwData(epw,value){
	var month = epw.month();
	var day = epw.day();
	var hour = epw.hour();
	var dayOfYear = [];
	var data = [];

	for (var i=0; i < value.length; i++){
	  dayOfYear[i] = Math.floor(i/24)+1;
	  datum = {"index":i,"month":month[i],"day":day[i],"hour":hour[i],"dayOfYear":dayOfYear[i],"value":value[i]};
	  data.push(datum);
	};
    
    //console.log(data);
    return data;
};

//unit coversion functions, could be done more cleanly
function valCtoF(value,index,arr) {
    arr[index] = 32 + value*1.8;
};
function convertCtoF(array) {
    array.forEach(valCtoF);
    return array;
};
function valKnots(value,index,arr) {
    arr[index] = value*1.94384;
};
function convertKnots(array) {
    array.forEach(valKnots);
    return array;
};

//initialization code for the drybulb temperature floodplot
function epwTempFloodPlot(epw) {
    params = {};
    var value = [];
    if (unitSystem == "IP") {
        value = convertCtoF(epw.dryBulbTemperature());
        params.unit = "\xB0F";
    } else {
        value = epw.dryBulbTemperature();
        params.unit = "\xB0C";
    };
    var data = epwData(epw,value); //encoding most of the object construction here    
    params.id = "#epwTempFloodPlot";
    params.min_value = Math.min.apply(Math,value);
    params.max_value = Math.max.apply(Math,value);    
    params.steps = 8;
    params.step_colors = ['#144AFF','#137CE8', '#21C9FF', '#E6FF77', '#D3FF14', '#E8CE12', '#FFBC21','#E87C12', '#FF4207'];
    epwFloodPlot(data,params);
};

//general code for making a floodplot
function epwFloodPlot(data,params) {
	var min_value = params.min_value, 
		max_value = params.max_value,
		steps = params.steps,	//number of steps in color scale
		scale_step = (max_value - min_value)/steps,
		legend_step = (max_value - min_value)/(steps+1),
		legend_scale = [],
		color_values = [];
		
	for (var i=0; i < steps + 2; i++) {
		var step = min_value + i*legend_step;
		legend_scale[i] = step.toFixed(1) + params.unit;
	};
	
	//define color map
	for (var i = 0; i < steps + 1; i++) {
		color_values.push(min_value + scale_step*i);
	}		
	var colorScale = d3.scale.linear()
		.domain(color_values)
		.range(params.step_colors);
		
	//define grid and svg
	var gridSize = 30,
		h = gridSize/2,		//height of each row in the floodPlot
		w = gridSize/10,	//width of each column in the floodPlot
		rectPadding = 0;
	
	var margin = {top: 10, right: 120, bottom: 40, left: 40},
		width = w*366, //extra day to account for leap years
		height = h*24;
	
	var svg = d3.select(params.id).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom);
	
	//floodPlot
	svg.append("g")
		.attr("class", "floodPlot")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.selectAll("rect")
		.data(data, function(d) { return d.dayOfYear + ':' + d.hour; })
	  .enter().append("rect")
		.attr("x", function(d) { return d.dayOfYear * w; })
		.attr("y", function(d,i) { return height - (d.hour+1)*h; })
		.attr("width", function(d) { return w; })
		.attr("height", function(d) { return h; })
		.style("fill", function(d) { return colorScale(d.value); });
	
	//legend element
	var legend = svg.append("g")
		.attr("class","legend")
		.attr("transform", "translate(" + (width + margin.left) + "," + margin.top + ")")
	
	// color legend for color scale
	legend.selectAll("rect")
		.data(colorScale.domain())
	  .enter().append("rect")
		.attr("x", 5)
		.attr("y", function(d,i) {return height - (h*24/(steps+1))*(i+1); } )
		.attr("width", 15)
		.attr("height", h*24/8)
		.style("fill", function(d) {return colorScale(d); })

	// text label for the color scale
	legend.selectAll("text")
		.data(legend_scale)
	 .enter().append("text")
		.style("text-anchor", "left")
		.attr("x", 20)
		.attr("y", function(d,i) {return height - (h*24/(steps+1))*(i-0.1); } )
		.text(function(d, i) { return legend_scale[i]; });		
	
	// add times scale to the figure
	var times = ["12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm","12am"];
	var y = d3.scale.linear()
			.range([height - h, height - 25*h])
			.domain([1,25]),
		yAxis = d3.svg.axis()
			.orient("left")
			.scale(y)
			.ticks(25)
			.tickFormat( function(d,i) { return times[i]; });
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(yAxis);

	var data_month = [{"label":"Jan"},{"label":"Feb"},{"label":"Mar"},{"label":"April"},{"label":"May"},{"label":"June"},{"label":"July"},{"label":"Aug"},{"label":"Sept"},{"label":"Oct"},{"label":"Nov"},{"label":"Dec"}];

	// text label for month
	svg.append("g")			
		.attr("class", "axis")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.selectAll("text")	
		.data(data_month)
	  .enter().append("text")             
		.style("text-anchor", "middle")
		.attr("x", function(d,i) {return width*i/12 + w*15; } )
		.attr("y", height + 20)
		.text(function(d, i) { return data_month[i].label; });
};


function simpleGraph(epw){
	//Setup area and svg for drawing graph
	var value = [];
	params = {};
	value = epw.dryBulbTemperature();
	var svg = d3.select("body").append("svg")
	          .attr("height","400")
	          .attr("width","100%");
    var data = epwData(epw, value);

    //Create and map color scale to values
    var min_value = Math.min.apply(Math,value),
     max_value = Math.max.apply(Math,value),    
     steps = 9,	//number of steps in color scale
	 scale_step = (max_value - min_value)/steps,
	 //legend color mapping for further improvement
	 //legend_step = (max_value - min_value)/(steps+1),
	 //legend_scale = [],
	 color_values = [],
	 step_colors = ['#144AFF','#137CE8', '#21C9FF', '#E6FF77', '#D3FF14', '#E8CE12', '#FFBC21','#E87C12', '#FF4207'];	
	//define color map
	for (var i = 0; i < steps + 1; i++) {
		color_values.push(min_value + scale_step*i);
	}		
	var colorScale = d3.scale.linear()
		.domain(color_values)
		.range(step_colors);
	
   //Draw histogram with bars styled with color mappings
	svg.selectAll("rect")
	    .data(data)
	    .enter().append("rect")
	    	  .attr("class", "bar")
	    	  .style("fill", function(d) { return colorScale(d.value)})
	          .attr("height", function(d) {return (d.value * 10)})
	          .attr("width","1")
	          .attr("x", function(d) {return (d.dayOfYear*24+d.hour)})
	          .attr("y", function(d){return (400-(d.value*10))});
	          
}

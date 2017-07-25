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
		.attr("width", function(d) { return w*0.8; })
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
	var value = [], xAxis, yAxis;
	params = {},
	height = 800;
	value = epw.dryBulbTemperature();
	var svg = d3.select("body").append("svg")
	          .attr("height", height)
	          .attr("width","100%")
	          .attr("id", "#epwTempHistogram");
    var data = epwData(epw, value);

    //Create and map color scale to values
    var min_value = Math.min.apply(Math,value),
     max_value = Math.max.apply(Math,value),    
     steps = 9,	//number of steps in color scale
	 scale_step = (max_value - min_value)/steps,
	 temps = [],
	 legend_step = (max_value - min_value)/(steps+1),
	 //legend color mapping for further improvement
	 //legend_step = (max_value - min_value)/(steps+1),
	 //legend_scale = [],
	 color_values = [],
	 step_colors = ['#144AFF','#137CE8', '#21C9FF', '#E6FF77', '#D3FF14', '#E8CE12', '#FFBC21','#E87C12', '#FF4207'];	
	//define color map
	for (var i = 0; i < steps + 1; i++) {
		color_values.push(min_value + scale_step*i);
		temps.push((Math.round(max_value - legend_step*i)));
	}		
	var colorScale = d3.scale.linear()
		.domain(color_values)
		.range(step_colors);
	var barScaleFactor = 400 / max_value;
	var width = window.innerWidth;
	var margin = {top: 10, right: 120, bottom: 40, left: 40};
	 //initialize axis
    xAxis = d3.svg.axis().orient('bottom');
    yAxis = d3.svg.axis();
    var barWidth = (window.innerwidth);
    var range = max_value + Math.abs(min_value);
    if (min_value < 0){

    	var xAxisY = height - Math.abs(min_value) * ( height / range);
    }else {

    	var xAxisY = height;

    }

   //Draw histogram with bars styled with color mappings. Adjust graph dimensions to match max and min heights.
	svg.selectAll("rect")
	    .data(data)
	    .enter().append("rect")
	    	  .attr("class", "bar")
	    	  .style("fill", function(d) { return colorScale(d.value)})
	    	  .attr("height", function(d) {return (Math.abs(d.value) * height / range)})
	          .attr("width", (width/8760))
	          .attr("x", function(d) {return ((d.dayOfYear+d.hour/24)*(8760/width)*0.8)})
	          .attr("y", function(d){if (d.value<0){return (xAxisY)}else{return (xAxisY-(d.value*height/range))}})
	          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	          
	// populate legend temps: INCORRECT, FIX EQUATION
	for (var i = 0; i < steps; i++) {
		
		temps.push(xAxisY - i ) * range / height;
	}	
	


	//var times = [Math.round(min_value),"1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm",Math.round(max_value)];
	var y = d3.scale.linear()
			.range([0, 800])
			.domain([min_value, max_value]),
		yAxis = d3.svg.axis()
			.orient("left")
			.scale(y)
			.ticks(10)
			.tickFormat( function(d,i) { return temps[i]; });
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(yAxis);

	var data_month = [{"label":"Jan"},{"label":"Feb"},{"label":"Mar"},{"label":"April"},{"label":"May"},{"label":"June"},{"label":"July"},{"label":"Aug"},{"label":"Sept"},{"label":"Oct"},{"label":"Nov"},{"label":"Dec"}];

	// text label for month
	svg.selectAll("rect")
	    .append("rect")			
		.attr("class", "axis")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.selectAll("text")	
		.data(data_month)
	  .enter().append("text")             
		.style("text-anchor", "middle")
		.attr("x", function(d,i) {return width*i/12; } )
		.attr("y", height + 20)
		.text(function(d, i) { return data_month[i].label; });


		/*PNG Export functionality 
courtesy of tutorial by Nikita Rokotyan on blo.cks.org (http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177)
allows the downloading of embedded svg graphics as PNG files for easy implementation in reports,
documents, presentations etc*/


// Set-up the export button
d3.select('#savePNGButton').on('click', function(){
  var svgString = getSVGString(svg.node());
  svgString2Image( svgString, 2*width, 2*height, 'png', save ); // passes Blob and filesize String to the callback

  function save( dataBlob, filesize ){
    saveAs( dataBlob, 'D3 vis exported to PNG.png' ); // FileSaver.js function
  }
});

// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
  svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
  var cssStyleText = getCSSStyles( svgNode );
  appendCSS( cssStyleText, svgNode );

  var serializer = new XMLSerializer();
  var svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

  return svgString;

  function getCSSStyles( parentElement ) {
    var selectorTextArr = [];

    // Add Parent element Id and Classes to the list
    selectorTextArr.push( '#'+parentElement.id );
    for (var c = 0; c < parentElement.classList.length; c++)
        if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
          selectorTextArr.push( '.'+parentElement.classList[c] );

    // Add Children element Ids and Classes to the list
    var nodes = parentElement.getElementsByTagName("*");
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].id;
      if ( !contains('#'+id, selectorTextArr) )
        selectorTextArr.push( '#'+id );

      var classes = nodes[i].classList;
      for (var c = 0; c < classes.length; c++)
        if ( !contains('.'+classes[c], selectorTextArr) )
          selectorTextArr.push( '.'+classes[c] );
    }

    // Extract CSS Rules
    var extractedCSSText = "";
    for (var i = 0; i < document.styleSheets.length; i++) {
      var s = document.styleSheets[i];
      
      try {
          if(!s.cssRules) continue;
      } catch( e ) {
            if(e.name !== 'SecurityError') throw e; // for Firefox
            continue;
          }

      var cssRules = s.cssRules;
      for (var r = 0; r < cssRules.length; r++) {
        if ( contains( cssRules[r].selectorText, selectorTextArr ) )
          extractedCSSText += cssRules[r].cssText;
      }
    }
    

    return extractedCSSText;

    function contains(str,arr) {
      return arr.indexOf( str ) === -1 ? false : true;
    }

  }

  function appendCSS( cssText, element ) {
    var styleElement = document.createElement("style");
    styleElement.setAttribute("type","text/css"); 
    styleElement.innerHTML = cssText;
    var refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore( styleElement, refNode );
  }
}


function svgString2Image( svgString, width, height, format, callback ) {
  var format = format ? format : 'png';

  var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  var image = new Image();
  image.onload = function() {
    context.clearRect ( 0, 0, width, height );
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob( function(blob) {
      var filesize = Math.round( blob.length/1024 ) + ' KB';
      if ( callback ) callback( blob, filesize );
    });

    
  };

  image.src = imgsrc;
	
}

function selectChecked(){
  var selectedGraphs = [];
  	selectedGraphs.push('epwTempFloodPlot');

    if(d3.select("#floodplotCheck").property("checked")){
      selectedGraphs.push('epwTempFloodPlot');
    }

    if(d3.select("#histoCheck").property("checked")){
      selectedGraphs.push('epwTempHistogram');
 }
}

downloadPDFbutton.addEventListener("click", function() {
	  

	  var selectedGraphs = [];
  	

      if(d3.select("#floodplotCheck").property("checked")){
      	console.log('floodplot checked')
      selectedGraphs.push('epwTempFloodPlot');
      }

      if(d3.select("#histoCheck").property("checked")){
      	console.log('histogram checked')
      selectedGraphs.push('epwTempHistogram');}
	  
	  for (var j = 0; j < selectedGraphs.length; j++){
	  		console.log('selected ' + selectedGraphs[j]);

	  }
	  
	  try { 

	  	if(typeof selectedGraphs == "undefined" || selectedGraphs == null || selectedGraphs.length == 0){throw "No Graphs Selected!"}    

	    }
	    catch(err) {
	        window.alert (err);
	     }
	  var svg4pdf = [],
	   dimensions = [];
	  for (var i = 0; i < selectedGraphs.length; i++ ){
	  	  svg4pdf = document.getElementById(selectedGraphs[i]).innerHTML;
	 	  dimensions = document.getElementById(selectedGraphs[i]).getBoundingClientRect();
	 	  console.log("Adding " + selectedGraphs[i] + " to doc")
	 	  console.log('svg4pdf: '+svg4pdf+', '+'dimensions: '+dimensions)
	 	var doc = new jsPDF('landscape');

	  

	  
	  var documentX = 297, documentY = 210, margin = 25;
	  var printScalingX = (documentX - margin*2) / dimensions.width , printScalingY = (documentY - margin*2) / dimensions.height ;
	  if (printScalingX > printScalingY ){

	  	var printScaling = printScalingY };
	  if (printScalingX < printScalingY ){

	  	var printScaling = printScalingX};
	 

	  if (svg4pdf){
	    svg4pdf = svg4pdf.replace(/\r?\n|\r/g, '').trim();}
		
	  var canvas = document.createElement('canvas');
	  canvg(canvas, svg4pdf);

	  var imgData = canvas.toDataURL('image/png');
	  // generate the output PDF
	  //doc.addPage();
	  doc.addImage(imgData, 'PNG', margin,margin,dimensions.width * printScaling,dimensions.height * printScaling);
	  doc.save('epwVisDoc' + (Math.floor(Date.now() / 1000)) + '_' + i +'.pdf');
	  

	  	
	    
	}
	
});

}
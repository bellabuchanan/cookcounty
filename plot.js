async function drawChart2(dataset, goes,recNames) {
  // Data
  
  // Accessors
  const goAccessor = d => d.go
  
  const goIds = d3.range(goes.length)
  
  const educationAccessor = d => d.education
  const educationNames = [
    "I-Bond",
    "D-Bond",
    "C-Bond",
    "COEM",
    "No bail"
  ]
  const educationIds = d3.range(educationNames.length)
  
  const recAccessor = d => d.rec
  
  const recIds = d3.range(recNames.length)
  
  // probabilities
  const stackedProbabilities = {}
  dataset.forEach(startingPoint => {
    const key = getStatusKey(startingPoint)
    let stackedProbability = 0
    stackedProbabilities[key] = educationNames.map((education, i) => {
      stackedProbability += (startingPoint[education] / 100)
      if (i == educationNames.length - 1) {
        // account for rounding
        return 1
      } else {
        return stackedProbability
      }
    })
  })
  
  // persons
  let currentPersonId = 0
  function generatePerson(elapsed) {
    currentPersonId++
    const go = getRandomValue(goIds)
    const rec = getRandomValue(recIds)
    const statusKey = getStatusKey({
      go: goes[go],
      rec: recNames[rec],
    })
    const probabilities = stackedProbabilities[statusKey]
    const education = d3.bisect(probabilities, Math.random())
    
    return {
      id: currentPersonId,
      go,
      rec,
      education,
      startTime: elapsed + getRandomNumberInRange(-0.1, 0.1),
      yJitter: getRandomNumberInRange(-15, 15)
      
    }
  }
  
  // dimensions
  let dimensions = {
    width: d3.min([width, 1200]),
    height: 500,
    margin: {
      top: 10,
      right: 200,
      bottom: 10,
      left: 120,
    },
    pathHeight: 50,
    endsBarsWidth: 15,
    endingBarPadding: 3,
  }
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom
  
  // canvas
  const wrapper = d3.select("#wrapper2")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
  
  const bounds = wrapper.append("g")
    .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)
  
  // scales
  const xScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, dimensions.boundedWidth])
    .clamp(true)
  
  const startYScale = d3.scaleLinear()
    .domain([recIds.length, -1])
    .range([0, dimensions.boundedHeight])
  const endYScale = d3.scaleLinear()
    .domain([educationIds.length, -1])
    .range([0, dimensions.boundedHeight])
  
  const linkLineGenerator = d3.line()
    .x((d, i) => i * (dimensions.boundedWidth / 5))
    .y((d, i) => i <= 2
      ? startYScale(d[0])
      : endYScale(d[1])
    )
    .curve(d3.curveMonotoneX)
  
  const yTransitionProgressScale = d3.scaleLinear()
    .domain([0.45, 0.55])
    .range([0, 1])
    .clamp(true)
  
  const colorScale = d3.scaleLinear()
    .domain(d3.extent(recIds))
    .range(["#12CBC4", "#B53471"])
    .interpolate(d3.interpolateHcl)
  
  // draw data
  const linkOptions = d3.merge(
    recIds.map(startId => (
      educationIds.map(endId => (
        new Array(6).fill([startId, endId])
      ))
    ))
  )
  const linksGroup = bounds.append("g")
  const links = linksGroup.selectAll(".category-path")
    .data(linkOptions)
    .enter().append("path")
      .attr("class", "category-path")
      .attr("d", linkLineGenerator)
      .attr("stroke-width", dimensions.pathHeight)  
  
  // draw peripherals
  const trianglePoints = [
    "-7,  6",
    " 0, -6",
    " 7,  6",
  ].join(" ")
  
  
  const startingLabelsGroup = bounds.append("g")
    .style("transform", "translateX(-20px)")
  const startingLabels = startingLabelsGroup.selectAll(".start-label")
    .data(recIds)
    .enter().append("text")
      .attr("class", "label start-label")
      .attr("y", (d, i) => startYScale(i))
      .text((d, i) => sentenceCase(recNames[i]))
  const startLabel = startingLabelsGroup.append("text")
    .attr("class", "start-title")
    .attr("y", startYScale(recIds[recIds.length - 1]) - 65)
    .text("PSA")
  const startLabelLineTwo = startingLabelsGroup.append("text")
    .attr("class", "start-title")
    .attr("y", startYScale(recIds[recIds.length - 1]) - 50)
    .text("Recommendation")
  const startingBars = startingLabelsGroup.selectAll(".start-bar")
    .data(recIds)
    .enter().append("rect")
      .attr("x", 20)
      .attr("y", d => startYScale(d) - (dimensions.pathHeight / 2))
      .attr("width", dimensions.endsBarsWidth)
      .attr("height", dimensions.pathHeight)
      .attr("fill", colorScale)
   
  const endingLabelsGroup = bounds.append("g")
    .style("transform", `translateX(${dimensions.boundedWidth + 20}px)`)
  
  const endingLabels = endingLabelsGroup.selectAll(".end-label")
    .data(educationNames)
    .enter().append("text")
      .attr("class", "label end-label")
      .attr("y", (d, i) => endYScale(i) - 15)
      .text(d => d)
  
  const legendGroup = bounds.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${dimensions.boundedWidth}, 5)`)
  const femaleLegend = legendGroup.append("g")
    .attr("transform", `translate(${-dimensions.endsBarsWidth * 1.5 + dimensions.endingBarPadding + 1}, 0)`)
  femaleLegend.append("polygon")
    .attr("points", trianglePoints)
    .attr("transform", "translate(-7, 0)")
  femaleLegend.append("text")
    .attr("class", "legend-text-left")
    .text("BIPOC")
    .attr("x", -20)
    .attr("y", 4)
  femaleLegend.append("line")
    .attr("class", "legend-line")
    .attr("x1", -dimensions.endsBarsWidth / 2 + 19)
    .attr("x2", -dimensions.endsBarsWidth / 2 + 19)
    .attr("y1", 12)
    .attr("y2", 37)
  const maleLegend = legendGroup.append("g")
    .attr("transform", `translate(${-dimensions.endsBarsWidth / 2 - 4}, 0)`)
  maleLegend.append("circle")
    .attr("r", 5.5)
    .attr("transform", "translate(5, 0)")
  maleLegend.append("text")
    .attr("class", "legend-text-right")
    .text("White")
    .attr("x", 15)
    .attr("y", 4)
  maleLegend.append("line")
    .attr("class", "legend-line")
    .attr("x1", -dimensions.endsBarsWidth / 2 - 6)
    .attr("x2", -dimensions.endsBarsWidth / 2 - 6)
    .attr("y1", 12)
    .attr("y2", 37)
  
  // draw data
  const maleMarkers = endingLabelsGroup.selectAll(".male-marker")
    .data(educationIds)
    .enter().append("circle")
      .attr("class", "ending-marker male-marker")
      .attr("r", 5.5)
      .attr("cx", 5)
      .attr("cy", d => endYScale(d) + 5)
  
  
  const femaleMarkers = endingLabelsGroup.selectAll(".female-marker")
    .data(educationIds)
    .enter().append("polygon")
      .attr("class", "ending-marker female-marker")
      .attr("points", trianglePoints)
      .attr("transform", d => `translate(5, ${endYScale(d) + 20})`)
  
  const maxPeople = 10000
  let people = []
  const markersGroup = bounds.append("g")
    .attr("class", "markers-group")
  
  
  const endingBarGroup = bounds.append("g")
    .attr("transform", `translate(${dimensions.boundedWidth}, 0)`)
  
  function updateMarkers(elapsed) {
    const xProgressAccessor = d => (elapsed - d.startTime) / 5000
    if (people.length < maxPeople) {
      people = [
        ...people,
        ...d3.range(2).map(() => generatePerson(elapsed)),
      ]
    }
    
    const females = markersGroup.selectAll(".marker-circle")
      .data(people.filter(d => (
        xProgressAccessor(d) < 1
        && goAccessor(d) == 0
      )), d => d.id)
    females.enter().append("circle")
      .attr("class", "marker marker-circle")
      .attr("r", 5.5)
      .style("opacity", 0)
    females.exit().remove()
    
    const males = markersGroup.selectAll(".marker-triangle")
      .data(people.filter(d => (
        xProgressAccessor(d) < 1
        && goAccessor(d) == 1
      )), d => d.id)
    males.enter().append("polygon")
      .attr("class", "marker marker-triangle")
      .attr("points", trianglePoints)
      .style("opacity", 0)
    males.exit().remove()
    
    const markers = d3.selectAll(".marker")
    markers.style("transform", d => {
      const x = xScale(xProgressAccessor(d))
      const yStart = startYScale(recAccessor(d))
      const yEnd = endYScale(educationAccessor(d))
      const yChange = yEnd - yStart
      const yProgress = yTransitionProgressScale(xProgressAccessor(d))
      const y = yStart + (yChange * yProgress) + d.yJitter
      return `translate(${x}px, ${y}px)`
    })
      .attr("fill", d => colorScale(recAccessor(d)))
      .transition().duration(100)
        .style("opacity", d => xScale(xProgressAccessor(d)) < 10 ? 0 : 1)
    
    const endingGroups = educationIds.map((endId, i) => (
      people.filter(d => (
        xProgressAccessor(d) >= 1
        && educationAccessor(d) == endId
      ))
    ))
    
    const endingPercentages = d3.merge(
      endingGroups.map((peopleWithSameEnding, endingId) => (
        d3.merge(
          goIds.map(goId => (
            recIds.map(recId =>  {
              const peopleInBar = peopleWithSameEnding.filter(d => (
                goAccessor(d) == goId
              ))
              const countInBar = peopleInBar.length
              const peopleInBarWithSameStart = peopleInBar.filter(d => (
                recAccessor(d) == recId
              ))
              const count = peopleInBarWithSameStart.length
              const numberOfPeopleAbove = peopleInBar.filter(d => (
                recAccessor(d) > recId
              )).length
              return {
                endingId,
                recId,
                goId,
                count,
                countInBar,
                percentAbove: numberOfPeopleAbove / (peopleInBar.length || 1),
                percent: count / (countInBar || 1),
              }
            })
          ))
        )
      ))
    )
    
    endingBarGroup.selectAll(".ending-bar")
      .data(endingPercentages)
      .join("rect")
        .attr("class", "ending-bar")
        .attr("x", d => -dimensions.endsBarsWidth * (d.goId + 1) - (d.goId * dimensions.endingBarPadding))
        .attr("width", dimensions.endsBarsWidth)
        .attr("y", d => endYScale(d.endingId) - dimensions.pathHeight / 2 + dimensions.pathHeight * d.percentAbove)
        .attr("height", d => d.countInBar ? dimensions.pathHeight * d.percent : dimensions.pathHeight)
        .attr("fill", d => d.countInBar ? colorScale(d.recId) : "#DADADD")
    
    endingLabelsGroup.selectAll(".ending-value")
      .data(endingPercentages)
      .join("text")
        .attr("class", "ending-value")
        .attr("x", d => (d.recId) * 33 + 47)
        .attr("y", d => endYScale(d.endingId) - dimensions.pathHeight / 2 + 14 * d.goId + 35)
        .attr("fill", d => d.countInBar ? colorScale(d.recId) : "#DADADD")
        .text(d => d.count)
    
  }
  
  d3.timer(updateMarkers)
  
}

// helpter functions 
getRandomNumberInRange = (min, max) => Math.random() * (max - min) + min

getRandomValue = arr => arr[Math.floor(getRandomNumberInRange(0, arr.length))]

getStatusKey = ({go, rec}) => [go, rec].join("--")

sentenceCase = str => [
  str.slice(0, 1).toUpperCase(),
  str.slice(1),
].join("")

function getProb() {
  let result;
  const a = getRandomNumberInRange(0,100)
  if (a < 16) {
    result = 0;
  } else {
    result = 1;
  }
  return result;
}



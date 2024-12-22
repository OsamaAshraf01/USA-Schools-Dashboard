function fetchData(query) {
  query = query.replace(/\n/g, " ");
  return fetch("/get-data/" + query)
    .then((response) => response.json())
    .catch((error) => console.error("Error:", error));
}

function setText(elementId, text) {
  var element = document.getElementById(elementId);
  if (element) {
    element.textContent = text; // Sets the text of the element
  }
}

function linearRegression(data) {
  let n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  data.forEach(function (point) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  });

  let slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  let intercept = (sumY - slope * sumX) / n;

  return { slope: slope, intercept: intercept };
}

function updateCharts() {
  //! ///////////////// Update Status Cards ////////////////////
  fetchData(
    `
      SELECT COUNT(*) AS value
      FROM usa_schools
      WHERE population > 0
    `
  ).then((response) => {
    console.log(response);
    setText("totalSchools", response[0].value.toLocaleString());
  });
  fetchData(
    `
      SELECT SUM(population) AS value
      FROM usa_schools
    `
  ).then((response) => {
    console.log(response);
    setText("totalStudents", response[0].value.toLocaleString());
  });

  fetchData(
    `
      SELECT SUM(ft_teacher) AS value
      FROM usa_schools
    `
  ).then((response) => {
    console.log(response);
    setText("totalTeachers", response[0].value.toLocaleString());
  });

  fetchData(
    `
      SELECT AVG(student_teacher_ratio) AS value
      FROM usa_schools
    `
  ).then((response) => {
    console.log(response);
    setText("avgStTchRatio", Math.round(response[0].value).toString() + ":1");
    var value =
      ((20 - response[0].value) / 20) * (-1 * (response[0].value < 20)); // Assuming that the standard is 20:1
    if (value < 0) {
      document.getElementById("avgStTchRatioPercent").classList.add("positive");
    } else {
      document.getElementById("avgStTchRatioPercent").classList.add("negative");
    }

    value = new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

    value = value.toString();
    if (value[0] != "-") value = "+" + value;

    setText("avgStTchRatioPercent", value);
  });

  // Create root elements
  const pieRoot = am5.Root.new("pieChart");
  const columnRoot = am5.Root.new("columnChart");
  const lineRoot = am5.Root.new("lineChart");
  const radarRoot = am5.Root.new("radarChart");
  const root = am5.Root.new("mapChart");
  const scatterRoot = am5.Root.new("scatterChart");

  // Set themes
  pieRoot.setThemes([am5themes_Animated.new(pieRoot)]);
  columnRoot.setThemes([am5themes_Animated.new(columnRoot)]);
  lineRoot.setThemes([am5themes_Animated.new(lineRoot)]);
  radarRoot.setThemes([am5themes_Animated.new(radarRoot)]);
  root.setThemes([am5themes_Animated.new(root)]);
  scatterRoot.setThemes([am5themes_Animated.new(scatterRoot)]);

  //! /////////////////////////// Pie Chart /////////////////////////////////
  const pieChart = pieRoot.container.children.push(
    am5percent.PieChart.new(pieRoot, {
      layout: pieRoot.verticalLayout,
      innerRadius: am5.percent(50),
    })
  );

  const pieSeries = pieChart.series.push(
    am5percent.PieSeries.new(pieRoot, {
      valueField: "value",
      categoryField: "Level",
      endAngle: 270,
      alignLabels: false,
    })
  );

  pieSeries.labels.template.setAll({
    forceHidden: true,
  });

  // pieSeries.ticks.template.setAll({
  //   forceHidden: true,
  // });

  pieSeries.slices.template.setAll({
    strokeWidth: 2,
    stroke: am5.color("#fff"),
  });

  fetchData(
    `
    SELECT
      CASE
        WHEN level_ = '1' THEN 'Elementary'
        WHEN level_ = '2' THEN 'Middle'
        WHEN level_ = '3' THEN 'High'
        WHEN level_ = '4' THEN 'Combined'
        WHEN level_ = 'N' THEN 'Not Applicable'
        ELSE 'Unknown'
      END AS Level, COUNT(*) AS value
    FROM usa_schools
    GROUP BY Level
    ORDER BY value DESC
    `
  ).then((chartData) => {
    console.log(chartData);
    pieSeries.data.setAll(chartData);
  });

  //! /////////////////////// Scatter Chart ///////////////////////////////////////
  var scatterChart = scatterRoot.container.children.push(
    am5xy.XYChart.new(scatterRoot, {
      panX: true,
      panY: true,
      wheelY: "zoomXY",
      pinchZoomX: true,
      pinchZoomY: true,
    })
  );

  // Create axes
  var xAxis = scatterChart.xAxes.push(
    am5xy.ValueAxis.new(scatterRoot, {
      renderer: am5xy.AxisRendererX.new(scatterRoot, { minGridDistance: 50 }),
      tooltip: am5.Tooltip.new(scatterRoot, {}),
      autoZoom: false,
    })
  );

  xAxis.ghostLabel.set("forceHidden", true);

  var yAxis = scatterChart.yAxes.push(
    am5xy.ValueAxis.new(scatterRoot, {
      renderer: am5xy.AxisRendererY.new(scatterRoot, {}),
      tooltip: am5.Tooltip.new(scatterRoot, {}),
      autoZoom: false,
    })
  );

  yAxis.ghostLabel.set("forceHidden", true);

  // Create series
  var scatterSeries = scatterChart.series.push(
    am5xy.LineSeries.new(scatterRoot, {
      calculateAggregates: true,
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "y",
      valueXField: "x",
      tooltip: am5.Tooltip.new(scatterRoot, {
        labelText:
          "state: {state}, \nAverage Population: {valueX}, \nAverage Full-Time Teachers: {valueY}",
      }),
    })
  );

  // Add bullet
  scatterSeries.bullets.push(function () {
    var graphics = am5.Circle.new(scatterRoot, {
      fill: scatterSeries.get("fill"),
      radius: 4,
    });
    return am5.Bullet.new(scatterRoot, {
      sprite: graphics,
    });
  });

  scatterSeries.strokes.template.set("strokeOpacity", 0);

  // trend series
  var trendSeries = scatterChart.series.push(
    am5xy.LineSeries.new(scatterRoot, {
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "y",
      valueXField: "x",
      stroke: scatterSeries.get("stroke"),
    })
  );

  scatterChart.set(
    "cursor",
    am5xy.XYCursor.new(scatterRoot, {
      xAxis: xAxis,
      yAxis: yAxis,
    })
  );

  fetchData(
    `
    SELECT state, ROUND(x, 0) AS x, ROUND(y, 0) AS y
    FROM (
      SELECT state, AVG(population) AS x, AVG(ft_teacher) AS y
      FROM usa_schools
      GROUP BY state
    )
    WHERE x IS NOT NULL AND y IS NOT NULL
    `
  ).then((data) => {
    scatterSeries.data.setAll(data);
    var regression = linearRegression(data);

    var trendLineData = data.map(function (point) {
      return {
        x: point.x,
        y: regression.slope * point.x + regression.intercept,
      };
    });
    trendSeries.data.setAll(trendLineData);
  });

  // Make stuff animate on load
  // https://www.amcharts.com/docs/v5/concepts/animations/
  scatterSeries.appear(1000);

  trendSeries.appear(1000);

  scatterChart.appear(1000, 100);

  //! /////////////////////// Column Chart ///////////////////////////////////////
  const columnChart = columnRoot.container.children.push(
    am5xy.XYChart.new(columnRoot, {
      panX: true,
      panY: true,
      // wheelX: "panX",
      // wheelY: "zoomX",
    })
  );

  // X-Axis configuration
  const columnXAxis = columnChart.xAxes.push(
    am5xy.CategoryAxis.new(columnRoot, {
      categoryField: "grade",
      renderer: am5xy.AxisRendererX.new(columnRoot, {
        minGridDistance: 30,
      }),
      tooltip: am5.Tooltip.new(columnRoot, {
        themeTags: ["axis"],
        animationDuration: 200,
      }),
    })
  );

  columnXAxis.get("renderer").labels.template.setAll({
    rotation: -45,
    centerY: am5.p50,
    centerX: am5.p100,
  });

  // Y-Axis configuration
  const columnYAxis = columnChart.yAxes.push(
    am5xy.ValueAxis.new(columnRoot, {
      renderer: am5xy.AxisRendererY.new(columnRoot, {
        minGridDistance: 30,
      }),
      min: 0, // Set minimum value to 0
      numberFormat: "#,###",
    })
  );

  // Series configuration
  const columnSeries = columnChart.series.push(
    am5xy.ColumnSeries.new(columnRoot, {
      name: "total_schools_count",
      xAxis: columnXAxis,
      yAxis: columnYAxis,
      valueYField: "total_schools_count",
      categoryXField: "grade",
      tooltipY: 0,
    })
  );

  // Configure series tooltip
  columnSeries.bullets.push(function () {
    return am5.Bullet.new(columnRoot, {
      sprite: am5.Label.new(columnRoot, {
        // text: "{valueY}",
        // populateText: true,
        centerY: am5.p50,
        centerX: am5.p50,
        tooltipY: 0,
      }),
    });
  });

  // Configure tooltip
  columnSeries.set(
    "tooltip",
    am5.Tooltip.new(columnRoot, {
      labelText: "{valueY} Schools",
      pointerOrientation: "horizontal",
      animationDuration: 200,
    })
  );

  // Make sure data is sorted by value
  columnChart.set("cursor", am5xy.XYCursor.new(columnRoot, {}));

  // Set data for the series
  fetchData(
    `
    SELECT grade, SUM(total_schools_count) AS total_schools_count FROM
    (
      WITH RECURSIVE grade_range AS 
      (
          SELECT -2 AS grade
          UNION ALL
          SELECT grade + 1
          FROM grade_range
          WHERE grade < 16
      )
      SELECT 
          CASE grade
            WHEN -2 THEN 'N'
            WHEN -1 THEN 'PK'
            WHEN 0 THEN 'KG'
            WHEN 1 THEN 'G1'
            WHEN 2 THEN 'G2'
            WHEN 3 THEN 'G3'
            WHEN 4 THEN 'G4'
            WHEN 5 THEN 'G5'
            WHEN 6 THEN 'G6'
            WHEN 7 THEN 'G7'
            WHEN 8 THEN 'G8'
            WHEN 9 THEN 'G9'
            WHEN 10 THEN 'G10'
            WHEN 11 THEN 'G11'
            WHEN 12 THEN 'G12'
            ELSE 'Special Grades'
          END as grade,
        COUNT(*) as total_schools_count
      FROM grade_range gr
      LEFT JOIN usa_schools s 
        ON gr.grade BETWEEN s.st_grade AND s.end_grade
      GROUP BY gr.grade
    )
    GROUP BY grade
    ORDER BY 
      CASE grade
        WHEN 'N' THEN -2
        WHEN 'PK' THEN -1
        WHEN 'KG' THEN 0
        WHEN 'G1' THEN 1
        WHEN 'G2' THEN 2
        WHEN 'G3' THEN 3
        WHEN 'G4' THEN 4
        WHEN 'G5' THEN 5
        WHEN 'G6' THEN 6
        WHEN 'G7' THEN 7
        WHEN 'G8' THEN 8
        WHEN 'G9' THEN 9
        WHEN 'G10' THEN 10
        WHEN 'G11' THEN 11
        WHEN 'G12' THEN 12
        ELSE 13
      END
  `
  )
    .then((chartData) => {
      if (chartData && chartData.length > 0) {
        console.log("---->", chartData);
        columnSeries.data.setAll(chartData);
        columnXAxis.data.setAll(chartData);
      } else {
        console.error("No data returned from the query");
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });

  //! /////////////////////// Line Chart ///////////////////////////////////
  const lineChart = lineRoot.container.children.push(
    am5xy.XYChart.new(lineRoot, {
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX",
    })
  );

  const lineXAxis = lineChart.xAxes.push(
    am5xy.DateAxis.new(lineRoot, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(lineRoot, {}),
    })
  );

  const lineYAxis = lineChart.yAxes.push(
    am5xy.ValueAxis.new(lineRoot, {
      renderer: am5xy.AxisRendererY.new(lineRoot, {}),
    })
  );

  const lineSeries = lineChart.series.push(
    am5xy.LineSeries.new(lineRoot, {
      name: "Growth",
      xAxis: lineXAxis,
      yAxis: lineYAxis,
      valueYField: "value",
      valueXField: "date",
      tooltip: am5.Tooltip.new(lineRoot, {
        labelText: "{valueY}",
      }),
    })
  );

  const lineData = [];
  let date = new Date();
  let value = 100;

  for (let i = 0; i < 100; i++) {
    value += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 20);
    lineData.push({
      date: new Date(date.getTime()).getTime(),
      value: value,
    });
    date.setDate(date.getDate() + 1);
  }

  lineSeries.data.setAll(lineData);

  //! //////////////////////////// Radar Chart /////////////////////////////
  const radarChart = radarRoot.container.children.push(
    am5radar.RadarChart.new(radarRoot, {
      panX: false,
      panY: false,
    })
  );

  const radarXAxis = radarChart.xAxes.push(
    am5xy.CategoryAxis.new(radarRoot, {
      renderer: am5radar.AxisRendererCircular.new(radarRoot, {}),
      categoryField: "category",
    })
  );

  // Set categories for the X axis
  radarXAxis.data.setAll([
    { category: "Speed" },
    { category: "Reliability" },
    { category: "Comfort" },
    { category: "Safety" },
    { category: "Efficiency" },
  ]);

  const radarYAxis = radarChart.yAxes.push(
    am5xy.ValueAxis.new(radarRoot, {
      renderer: am5radar.AxisRendererRadial.new(radarRoot, {}),
    })
  );

  const radarSeries = radarChart.series.push(
    am5radar.RadarLineSeries.new(radarRoot, {
      name: "Metrics",
      xAxis: radarXAxis,
      yAxis: radarYAxis,
      valueYField: "value",
      categoryXField: "category",
      tooltip: am5.Tooltip.new(radarRoot, {
        labelText: "{valueY}",
      }),
    })
  );

  // Set data for the radar chart series
  radarSeries.data.setAll([
    { category: "Speed", value: 80 },
    { category: "Reliability", value: 90 },
    { category: "Comfort", value: 85 },
    { category: "Safety", value: 95 },
    { category: "Efficiency", value: 88 },
  ]);

  //! /////////////////// Map Chart //////////////////////////////
  const chart = root.container.children.push(
    am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "rotateY",
      projection: am5map.geoAlbersUsa(),
      layout: root.horizontalLayout,
    })
  );

  // Create polygon series for the USA map
  const polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_usaLow,
      valueField: "value",
      calculateAggregates: true,
    })
  );

  // Configure polygon series
  polygonSeries.mapPolygons.template.setAll({
    tooltipText: "{name}: {value} Student",
    interactive: true,
    fill: am5.color(0xaaaaaa),
    templateField: "polygonSettings",
  });

  // Add a heat rules & legend
  fetchData(
    "SELECT MAX(total_weight) as max, MIN(total_weight) AS min " +
      "FROM " +
      "(SELECT SUM(population) AS total_weight FROM usa_schools GROUP BY state)"
  ).then((response) => {
    response = response[0];
    console.log(response);
    // Add heat rule to polygonSeries
    polygonSeries.set("heatRules", [
      {
        target: polygonSeries.mapPolygons.template,
        dataField: "value",
        min: am5.color(0x67b7dc), // Light blue
        max: am5.color(0x1c5e7d), // Dark blue
        minValue: response.min, // Minimum data value
        maxValue: response.max, // Maximum data value
        key: "fill",
      },
    ]);
    const heatLegend = chart.children.push(
      am5.HeatLegend.new(root, {
        orientation: "vertical",
        startColor: am5.color(0x67b7dc),
        endColor: am5.color(0x1c5e7d),
        startText: response.min,
        endText: response.max,
      })
    );
    heatLegend.startLabel.setAll({
      fontSize: 12,
      fill: root.interfaceColors.get("text"),
    });
    heatLegend.endLabel.setAll({
      fontSize: 12,
      fill: root.interfaceColors.get("text"),
    });
  });

  // Create hover state
  const polygonHoverState = polygonSeries.mapPolygons.template.states.create(
    "hover",
    {
      // fill: am5.color(0x6771dc), // Change fill color
      stroke: am5.color(0x000000), // Add border color on hover
      strokeWidth: 2, // Increase border width
      // fillOpacity: 0.8, // Adjust opacity for a smoother effect
      // shadowColor: am5.color(0x000000), // Add shadow
      // shadowOffsetX: 2, // Set shadow horizontal offset
      // shadowOffsetY: 2, // Set shadow vertical offset
      // shadowBlur: 5, // Set shadow blur radius
    }
  );

  // Add zoom control
  chart.set("zoomControl", am5map.ZoomControl.new(root, {}));

  // Sample data
  // Replace with your actual data
  fetchData(
    // SELECT "US-"  || state AS id, COUNT(*) AS value FROM usa_schools GROUP BY state ORDER BY value;
    'SELECT "US-" || state AS id, SUM(population) AS value ' +
      "FROM usa_schools WHERE state IS NOT NULL " +
      "GROUP BY state ORDER BY value;"
  ).then((mapData) => {
    console.log(mapData);
    polygonSeries.data.setAll(mapData);
  });

  // Make map load all the visual elements
  chart.appear(1000, 100);

  //! //////////////////////////// Animation on load ////////////////////////////////
  pieSeries.appear(1000);
  radarSeries.appear(1000);
  lineSeries.appear(1000);
  columnSeries.appear(1000);

  pieChart.appear(1000, 100);
  radarChart.appear(1000, 100);
  lineChart.appear(1000, 100);
  columnSeries.appear(1000, 100);
}

document.addEventListener("DOMContentLoaded", function () {
  updateCharts();
});

window.onload = function () {

    // Colors
    var COLOR_1 = "#1093a7",
        COLOR_2 = "#24454c",
        COLOR_3 = "#def2f3",
        COLOR_4 = "#589ba4",
        WHITE_COLOR = "#ffffff",
        BLACK_COLOR = "#000",
        CURRENT_VERTEX_COLOR = "#ff3300",
        CURRENT_EDGE_COLOR = "#ff3300",
        DISABLED_COLOR = "#808080",
        VISIT_VERTEX_COLOR = "#808080",
        VISIT_EDGE_COLOR = "#808080",
        ADJACENCY_VERTEX_COLOR = "#ffffcc",
        START_VERTEX_COLOR = "#00ff00",
        DEFAULT_VERTEX_COLOR = "#ffffff",
        DEFAULT_EDGE_COLOR = "#000";

    // Canvas variables
    var canvas,
        ctx,
        graph,
        render,
        dragNode,
        dragPoint,
        firstSelectedNode = undefined, // First selected node in "create edge"
        startVertex = undefined; // Start vertex for algorithm

    // Info div
    var idRow, // First row in table with id
        distancesRow, // Second row in table with distances
        prevVertexRow, // // Third row in table with id of prev
        infoField,
        sendInfo,
        clearInfo;

    // In algorithm div info field
    infoField = document.getElementById("info_field");
    // Add info to info field
    sendInfo = function (info) {
        infoField.innerHTML += "> " + info + "<br>";
        infoField.scrollTop = 9999; // Scroll to last string in field
    };
    // Delete all info in field
    clearInfo = function () {
        infoField.innerHTML = "";
    };

    // Buttons
    var currentBtn, // Current selected button
        prevStyle, // Previous style of current button
        btnCreateVertex,
        btnCreateEdge,
        btnStart,
        btnPause,
        btnStop,
        btnView,
        btnClearGraph,
        btnNextStep,
        btnSelectStartVertex,
        btnCreateRandomGraph,
        graphBtns; // Buttons from graph div

    /*
        GRAPH DIV BUTTONS
    */
    btnCreateVertex = document.getElementById('btnCreateVertex');
    btnCreateVertex.addEventListener("click", function (event) {
        changeCurrentButton(btnCreateVertex);
    }, false);

    btnCreateEdge = document.getElementById('btnCreateEdge');
    btnCreateEdge.addEventListener("click", function (event) {
        changeCurrentButton(btnCreateEdge);
    }, false);

    btnView = document.getElementById('btnView');
    btnView.addEventListener("click", function (event) {
        changeCurrentButton(btnView);
    }, false);

    btnClearGraph = document.getElementById('btnClearGraph');
    btnClearGraph.addEventListener("click", function (event) {
        clearGraph();
        render();
    }, false);

    btnCreateRandomGraph = document.getElementById("btnCreateRandomGraph");
    btnCreateRandomGraph.addEventListener("click", function (event) {
        createRandomGraph();
    }, false);

    /*
     Algorithm DIV BUTTONS
     */
    btnStart = document.getElementById("btnStart");
    btnStart.disabled = true;
    btnStart.addEventListener("click", function (event) {
        currentStep = startDijkstra;
        btnStop.disabled = false;
        btnPause.disabled = false;
        btnStart.disabled = true;
        isStopped = false;
        isPaused = false;
        nextStep(currentStep, 1);
    }, false);

    btnPause = document.getElementById("btnPause");
    btnPause.disabled = true;
    btnPause.addEventListener("click", function (event) {
        if(isPaused){ // If click when algorithm is pausing
            changeContinueButton();
            nextStep(currentStep, 1);
        } else{ // If click when algorithm is working
            isPaused = true;
            btnNextStep.disabled = false;
            btnPause.innerHTML = "Continue";
            clearTimeout(nextTimer);
        }
    }, false);

    btnStop = document.getElementById("btnStop");
    btnStop.disabled = true;
    btnStop.addEventListener("click", function (event) {
        clearTimeout(nextTimer);
        isStopped = true;
        btnStop.disabled = true;
        isPaused = false;
        btnStart.disabled = false;
        changeContinueButton();
        btnPause.disabled = true;
        clearAlgorithmInfo();
        sendInfo("Select <b>Start vertex</b> and press <b>Start</b> to begin the algorithm");
        setGraphBtnsDisabledProperty(false);  // Switch off graph buttons for disable graph changes
        render();
    }, false);

    btnNextStep = document.getElementById("btnNextStep");
    btnNextStep.disabled = true;
    btnNextStep.addEventListener("click", function (event) {
        isSkipped = true;
        nextStep(currentStep);
    }, false);

    btnSelectStartVertex = document.getElementById("btnSelectStartVertex");
    btnSelectStartVertex.addEventListener("click", function (event) {
        changeCurrentButton(btnSelectStartVertex);
    }, false);

    var clearAlgorithmInfo = function () {
        clearInfo();
        recreateAlgorithmExtraInfo();
        // Clean table
        for(var i = 0; i < graph.nodes.length; i++){
            graph.setNodeColor(i, DEFAULT_VERTEX_COLOR); // Return back default color for vertices
            distancesRow.cells[i + 1].innerHTML = "";
            prevVertexRow.cells[i + 1].innerHTML = "";
        }
        startVertex.color = START_VERTEX_COLOR;

        // Return back default color for edges
        for(var i = 0; i < graph.edges.length; i++){
            graph.setEdgeColor(i, DEFAULT_EDGE_COLOR);
        }
    };

    // Buttons from graph div
    graphBtns = [btnView, btnCreateVertex, btnCreateEdge, btnCreateRandomGraph, btnClearGraph, btnSelectStartVertex];

    // Change disabled property for all graph buttons
    var setGraphBtnsDisabledProperty = function(bool) {
        graphBtns.forEach(function(btn) {
            btn.disabled = bool;
        });
        if(bool){
            // Change style for disabled buttons
            currentBtn.style = prevStyle;
            //btnSelectStartVertex.style.visibility = "hidden";
        }
        else {
            // Return previous buttons style
            //btnSelectStartVertex.style.visibility = "visible";
            setStyleToCurrentButton(currentBtn);
        }
    };

    // Set style to current button
    var setStyleToCurrentButton = function (btn) {
        prevStyle = btn.style;
        btn.style.backgroundColor = "#ffffff";
        btn.style.border = "2px solid #589ba4";
        btn.cssText += "-webkit-transition-duration: 0s; transition-duration: 0s;";
    };

    currentBtn = btnView; // First current button is btnView
    setStyleToCurrentButton(currentBtn);

    // Change current button for new one
    var changeCurrentButton = function (button) {
        // If one vertices was picked in "Create edge" mode
        if(firstSelectedNode !== undefined) firstSelectedNode.node.color = firstSelectedNode.prevColor;
        firstSelectedNode = undefined;
        render();

        currentBtn.style = prevStyle; // Return previous style to previous current button
        // Change current button
        currentBtn = button;
        setStyleToCurrentButton(currentBtn);
    };

    var clearGraph = function () {
        graph = Graph(); // Create new graph
        startVertex = undefined;
        btnStart.disabled = true;

        // Delete all vertices from the table
        [idRow, distancesRow, prevVertexRow].forEach(function(row) {
            for(var i = row.cells.length - 1 ; i >= 1; i--){
                row.deleteCell(i);
            }
        });
    };

    var Graph = function(){
      return {
          // Vertices list
          // Vertex has coordinates, id and color
          nodes: [],

          edges: [],

          // Vertex's radius
          vertexRange: 30,

          // Create new vertices
          createNode: function(pos, id) {
              return {
                  x: pos.x,
                  y: pos.y,
                  id: id,
                  color: DEFAULT_VERTEX_COLOR,
                  edges: []
              }
          },

          // Find vertex in graph by ID
          getNode: function (ind) {
            return this.nodes[ind];
          },

          // Set new color for vertex
          setNodeColor: function (ind, color) {
              this.nodes[ind].color = color;
              render();
          },

          // Create new edge
          createEdge: function(from, to, weight, id) {
              return {
                  id: Number(id),
                  color: DEFAULT_EDGE_COLOR,
                  from: Number(from),
                  to: Number(to),
                  weight: Number(weight)
              }
          },

          // Set new color for edge
          setEdgeColor: function (ind, color) {
              this.edges[ind].color = color;
              render();
          }

      };
    };

    graph = Graph();

    canvas = document.getElementById('canvas');

    idRow = document.getElementById('tr_id');
    distancesRow = document.getElementById('tr_distances');
    prevVertexRow = document.getElementById('tr_prev_vertex');

    ctx = canvas.getContext('2d');

    // Redraw canvas and his elements
    render = function () {
        // Clear canvas
        ctx.fillStyle = WHITE_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw edges (drawing edges before vertices locate edges under vertices)
        graph.edges.forEach(function (edge) {
            var from = getNodeById(edge.from),
                to = getNodeById(edge.to);
            ctx.fillStyle = BLACK_COLOR;
            ctx.strokeStyle = edge.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            ctx.font = "24px Arial";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(edge.weight.toString(), (from.x + to.x) / 2, (from.y + to.y) / 2);
        });

        // Draw vertices
        graph.nodes.forEach(function (node) {
            ctx.beginPath();
            ctx.fillStyle = node.color;
            ctx.strokeStyle = BLACK_COLOR;
            ctx.arc(node.x, node.y, graph.vertexRange, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = BLACK_COLOR;
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(node.id.toString(), node.x, node.y);
        });
    };

    // Find node in graph by ID
    var getNodeById = function (id) {
        var result = undefined;
        graph.nodes.forEach(function (node) {
            if (node.id === id) {
                result = node;
            }
        });
        return result;
    };

    // Get from mouse event coordinates relatively left-top corner of canvas
    var getMousePosFromEvent = function (evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    // Find node by coordinates on canvas
    var getNodeByPos = function (pos) {
        var result = undefined;
        graph.nodes.forEach(function (node) {
            if ((node.x - pos.x) * (node.x - pos.x) + (node.y - pos.y) * (node.y - pos.y)
                <= graph.vertexRange * graph.vertexRange) {
                result = node;
            }
        });
        return result;
    };

    // When the mouse is pressed find node and remember that in dragNode
    // dragPoint remember what place in node was pressed
    canvas.addEventListener('mousedown', function (event) {
        // This function need only for "View" mode
        // For trace node moving
        if (currentBtn !== btnView) {
            return;
        }
        var pos = getMousePosFromEvent(event);
        dragNode = getNodeByPos(pos);
        // Find dragPoint
        if (dragNode !== undefined) {
            dragPoint = {
                x: pos.x - dragNode.x,
                y: pos.y - dragNode.y
            }
        }
    }, false);

    // When the mouse is depressed, forgot current dragNode
    canvas.addEventListener('mouseup', function () {
        dragNode = undefined;
    }, false);

    // Change node coordinate if it was moved and redraw it
    canvas.addEventListener('mousemove', function (event) {
        var pos;
        if (dragNode !== undefined) {
            pos = getMousePosFromEvent(event);
            dragNode.x = pos.x - dragPoint.x;
            dragNode.y = pos.y - dragPoint.y;
            render();
        }
    }, false);

    // Do action relatively current button mode
    canvas.addEventListener('click', function (event) {
        var pos = getMousePosFromEvent(event);
        switch (currentBtn.id) {
            case "btnCreateVertex":
                createVertex(pos);
                break;
            case "btnCreateEdge":
                createEdge(pos);
                break;
            case "btnSelectStartVertex":
                selectStartVertex(pos);
                break;
            default:
                return;
        }
        render();
    }, false);

    var createVertex = function (pos) {
        // Add new vertex in table
        var id = graph.nodes.length;
        var header = idRow.insertCell(id + 1);
        header.innerHTML = "<b>" + id.toString() + "</b>";
        distancesRow.insertCell(id + 1);
        prevVertexRow.insertCell(id + 1);

        // Add new vertex in graph
        graph.nodes.push(graph.createNode(pos, id));
    };
    
    var addEdgeToGraph = function (from, to, weight) {
        var edge1 = graph.createEdge(from, to, Number(weight), graph.edges.length),
            edge2 = graph.createEdge(to, from, Number(weight), graph.edges.length);
        // Add edge in two vertex because the edges in graph have two ways
        graph.nodes[from].edges.push(edge1);
        graph.nodes[to].edges.push(edge2);
        graph.edges.push(edge1);
    };
    
    var createEdge = function (pos) {
        // Find clicked node
        var node = getNodeByPos(pos);
        if(node === undefined || (firstSelectedNode !== undefined && node.id === firstSelectedNode.node.id)) return;

        // Set current color to this vertex
        var prevColor = node.color;
        node.color = CURRENT_VERTEX_COLOR;

        if (firstSelectedNode === undefined) { // If it is first choosing vertex
            firstSelectedNode = {
                node: node,
                prevColor: prevColor
            };
        } else {
            var weight = prompt("Enter edge's weight (Maximum is 30):");
            while(Number.isNaN(Number(weight)) || Number(weight) > 30){
                weight = prompt("Enter edge's weight (Maximum is 30):")
            }

            if (weight) {
                var firstId = firstSelectedNode.node.id,
                    secondId = node.id;

                addEdgeToGraph(firstId, secondId, weight);
            }

            // Forgot this vertices
            firstSelectedNode.node.color = firstSelectedNode.prevColor;
            node.color = prevColor;
            firstSelectedNode = undefined;
        }
    };

    var selectStartVertex = function (pos) {
        // Forgot previous vertex
        if(startVertex !== undefined) startVertex.color = DEFAULT_VERTEX_COLOR;
        startVertex = getNodeByPos(pos);

        if(startVertex === undefined) return;
        startVertex.color = START_VERTEX_COLOR;
        btnStart.disabled = false; // Open button start
    };

    var createRandomGraph = function () {
        clearGraph();

        // Ask vertex count
        var vertexCount;
        while((vertexCount = prompt("Enter vertices count (Maximum is 10)")) > 10);
        if(!vertexCount) return;

        // Save vertices position to colibrate their
        var verticesPos = [];

        var getRandomValue = function (limit) {
            return Math.floor(Math.random()*1000) % limit;
        };

        var compareCoordinateForCompatibility = function (pos1, pos2, withWhat) {
            return Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) > withWhat * withWhat;
        };

        var getRandomPos = function() {
            // For vertices don't touch the borders of canvas
            var checkBorders = function (pos) {
                var range = graph.vertexRange * 2;

                if(pos.x < range){
                    pos.x += range;
                }
                if(canvas.width - pos.x < range){
                    pos.x -= range;
                }
                if(pos.y < range){
                    pos.y += range;
                }
                if(canvas.height - pos.y < range){
                    pos.y -= range;
                }
                return pos;
            };
            return checkBorders({
                x: getRandomValue(canvas.width),
                y: getRandomValue(canvas.height)
            });
        };

        var checkPosCompatibility = function (pos) {
            var check = true;
            verticesPos.forEach(function(iter) {
                check = check && compareCoordinateForCompatibility(pos, iter, graph.vertexRange * 4);
            });
            return check;
        };

        // Generate vertices
        for(var i = 0; i < vertexCount; i++){
            var pos = getRandomPos();
            while(!checkPosCompatibility(pos)){
                pos = getRandomPos();
            }
            verticesPos.push(pos);
            createVertex(pos);
        }

        // Create adjacency matrix to generate random edges
        var adjacencyMatrix = new Array(vertexCount);
        for(var i = 0; i < vertexCount; i++){
            adjacencyMatrix[i] = new Array(vertexCount);
        }

        // For all pair of different vertices generate edges (If random want it)
        for(var i = 0; i < vertexCount; i++){
            for(var j = i; j < vertexCount; j++){
                if(i !== j && getRandomValue(2)){
                    addEdgeToGraph(i, j, getRandomValue(20));
                }
            }
        }
        render();
    };

    // Arrays for algorithm (Extra info)
    var distances,
        flags,
        edgesIdToPrevVertex;

    var recreateAlgorithmExtraInfo = function () {
        distances = [];
        flags = [];
        edgesIdToPrevVertex = [];
    };

    var INFINITY_CHAR = "&#8734";

    // --Set values to array and table
    var setDistance = function(ind, num) {
        distancesRow.cells[ind + 1].innerHTML = num !== Number.MAX_VALUE ? num.toString() : INFINITY_CHAR;
        distances[ind] = Number(num);
    };

    var setPrevVertex = function(to, from) {
        prevVertexRow.cells[to + 1].innerHTML = from.toString();
    };
    // --

    var getMinVertex = function() {
        var min = Number.MAX_VALUE;
        var index = -1;

        for(var i = 0; i < graph.nodes.length; i++){
            if(!flags[i] && distances[i] < min){
                min = distances[i];
                index = i;
            }
        }

        return (min < Number.MAX_VALUE) ? index : false;
    };

    // Variables for algorithm
    var speedSelect, // What speed of algorithm
        getSpeed,
        nextStep,
        nextTimer,
        currentStep,
        isStopped = false,
        isPaused = false,
        isSkipped = false,
        changeContinueButton,
        isPauseOrStop,
        currentVertex,
        edges,
        edge,
        prevColor;

    speedSelect = document.getElementById("speed_select");
    getSpeed = function () {
        return Number(speedSelect.options[speedSelect.options.selectedIndex].value);
    };

    changeContinueButton = function () {
        isPaused = false;
        btnNextStep.disabled = true;
        btnPause.innerHTML = "Pause";
    };

    // Do function after any time
    nextStep = function (func, timeInSec) {
        if(isSkipped){
            isSkipped = false;
            func();
            return;
        } else if(isPauseOrStop(func)) return;

        nextTimer = setTimeout(func, timeInSec*1000*(1/getSpeed()));
    };

    isPauseOrStop = function (func) {
        currentStep = func;
        return isStopped || isPaused;
    };

    var startDijkstra = function() {
        setGraphBtnsDisabledProperty(true);
        clearAlgorithmInfo();

        sendInfo("Start algorithm...");
        nextStep(setFirstDistances, 1);
    };

    var setFirstDistances = function () {
        sendInfo("Set starting value of distances to all vertices<br>" +
            "For starting vertex the value is <b>0</b> to another vertices <b>INFINITY</b>");
        // Set starting value of distances to all vertices
        for(var i = 0; i < graph.nodes.length; i++){
            setDistance(i, Number.MAX_VALUE);
            flags[i] = false;
        }
        edgesIdToPrevVertex = new Array(graph.nodes.length);

        setDistance(startVertex.id, 0);
        setPrevVertex(startVertex.id, "-");

        nextStep(checkVerticesStep, 3);
    };
    
    var checkVerticesStep = function () {
        currentVertex = getMinVertex();
        // If all vertices is checked
        if(currentVertex === false) {
            sendInfo("All vertices is checked");
            nextStep(endDijkstra, 3);
            return;
        }

        sendInfo("Choosing the vertex with minimal distance...<br>" +
            "ID of vertex with minimal distance is: <b>" + currentVertex + "</b>");
        flags[currentVertex] = true;
        graph.setNodeColor(currentVertex, CURRENT_VERTEX_COLOR);

        // Create edges array
        edges = [];
        graph.getNode(currentVertex).edges.forEach(function(edge) {
            edges.push(graph.createEdge(edge.from, edge.to, edge.weight, edge.id));
        });

        sendInfo("Run for all not visited edges from vertex <b>" + currentVertex + "</b>...");
        nextStep(checkEdgesStep, 3);
    };

    var checkEdgesStep = function() {
        if(edges.length > 0) checkEdgeStep();
        else {
            sendInfo("All edges from this vertex is checked");
            graph.setNodeColor(currentVertex,(currentVertex !== startVertex.id)
                ? VISIT_VERTEX_COLOR : START_VERTEX_COLOR);
            nextStep(checkVerticesStep, 3);
        }
    };

    var checkEdgeStep = function () {
        edge = edges.pop();
        // if vertex with ID edge.to is visited
        while(flags[edge.to]){
            edge = edges.pop();
            if(edge === undefined) {
                checkEdgesStep();
                return;
            }
        }

        sendInfo("Edge from <b>" + edge.from + "</b> to <b>" + edge.to + "</b> with weight <b>" + edge.weight + "</b>");
        prevColor = graph.getNode(edge.to).color;
        graph.setNodeColor(edge.to, ADJACENCY_VERTEX_COLOR);
        nextStep(checkDistancesStep, 3);
    };

    var checkDistancesStep = function () {
        var newDistance = Number(distances[currentVertex]) + Number(edge.weight);
        if(newDistance < distances[edge.to]) {
            var message = "Distance from this edge less then previous edge: <b>" + newDistance + " < ";
            message += distances[edge.to] !== Number.MAX_VALUE ? distances[edge.to].toString() : INFINITY_CHAR;
            sendInfo(message + "</b>");
            setDistance(edge.to, newDistance);
            setPrevVertex(edge.to, edge.from);
            // Change previous vertex
            if(edgesIdToPrevVertex[edge.to] !== undefined)
                graph.setEdgeColor(edgesIdToPrevVertex[edge.to], VISIT_EDGE_COLOR);
            edgesIdToPrevVertex[edge.to] = edge.id;
            graph.setEdgeColor(edge.id, CURRENT_EDGE_COLOR);
        } else{
            sendInfo("Distance from this edge more then previous edge: <b>" +
                + newDistance + " >= " + distances[edge.to].toString());
            graph.setEdgeColor(edge.id, VISIT_EDGE_COLOR);
        }
        graph.setNodeColor(edge.to, prevColor);
        nextStep(checkEdgesStep, 3);
    };

    var endDijkstra = function () {
        sendInfo("<b>The algorithm is done working</b>");
        // Block and unblock buttons
        isStopped = false;
        btnPause.disabled = true;
        isPaused = false;
        changeContinueButton();
    };

    render();

};
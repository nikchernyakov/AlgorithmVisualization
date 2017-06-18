window.onload = function () {

    var WHITE_COLOR = "#f3f3f3",
        BLACK_COLOR = "#000",
        CURRENT_VERTEX_COLOR = "#ff3300",
        VISIT_VERTEX_COLOR = "#808080",
        START_VERTEX_COLOR = "#00ff00",
        DEFAULT_VERTEX_COLOR = "#f3f3f3",
        DEFAULT_EDGE_COLOR = "#000";

    var speed = 1,
        canvas,
        ctx,
        graph,
        render,
        dragNode,
        dragPoint,
        firstSelectedNode = undefined,
        startVertex = undefined;

    var idRow,
        distancesRow,
        prevVertexRow,
        infoField,
        sendInfo,
        clearInfo;

    infoField = document.getElementById("info_field");
    sendInfo = function (info) {
        infoField.innerHTML += "> " + info + "<br>";
        infoField.scrollTop = 9999;
    };
    clearInfo = function () {
        infoField.innerHTML = "";
    };

    var currentBtn,
        btnCreateVertex,
        btnCreateEdge,
        btnWork,
        btnStop,
        btnView,
        btnClearGraph,
        btnSelectStartVertex,
        btnCreateRandomGraph;

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

    btnWork = document.getElementById("btnWork");
    btnWork.disabled = true;
    btnWork.addEventListener("click", function (event) {
        if(!isPaused || isStopped) currentStep = startDijkstra;
        btnStop.disabled = false;
        isStopped = false;
        isPaused = false;
        nextStep(currentStep, 1);
    }, false);

    btnStop = document.getElementById("btnStop");
    btnStop.disabled = true;
    btnStop.addEventListener("click", function (event) {
        isStopped = true;
        btnStop.disabled = true;
        clearAlgorithmInfo();
        render();
    }, false);

    var clearAlgorithmInfo = function () {
        clearInfo();
        recreateAlgorithmExtraInfo();
        for(var i = 0; i < graph.nodes.length; i++){
            graph.setNodeColor(i, DEFAULT_VERTEX_COLOR);
            distancesRow.cells[i + 1].innerHTML = "";
            prevVertexRow.cells[i + 1].innerHTML = "";
        }
        startVertex.color = START_VERTEX_COLOR;

        for(var i = 0; i < graph.edges.length; i++){
            graph.setEdgeColor(i, DEFAULT_EDGE_COLOR);
        }
    };
    
    btnSelectStartVertex = document.getElementById("btnSelectStartVertex");
    btnSelectStartVertex.addEventListener("click", function (event) {
        changeCurrentButton(btnSelectStartVertex);
    }, false);

    btnCreateRandomGraph = document.getElementById("btnCreateRandomGraph");
    btnCreateRandomGraph.addEventListener("click", function (event) {
        createRandomGraph();
    }, false);

    currentBtn = btnView;
    currentBtn.disabled = true;

    var changeCurrentButton = function (button) {

        if(firstSelectedNode !== undefined) firstSelectedNode.node.color = firstSelectedNode.prevColor;
        firstSelectedNode = undefined;

        currentBtn.disabled = false;
        button.disabled = true;
        currentBtn = button;

        render();
    };

    var clearGraph = function () {
        graph = Graph();
        startVertex = undefined;
        btnWork.disabled = true;

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

          createNode: function(pos, id) {
              return {
                  x: pos.x,
                  y: pos.y,
                  id: id,
                  color: DEFAULT_VERTEX_COLOR,
                  edges: []
              }
          },

          getNode: function (ind) {
            return this.nodes[ind];
          },

          setNodeColor: function (ind, color) {
              this.nodes[ind].color = color;
          },

          /*createEdge: function(from, to, weight) {
              return {
                  id: this.edges.length,
                  color: black,
                  from: Number(from),
                  to: Number(to),
                  weight: Number(weight)
              }
          },*/

          createEdge: function(from, to, weight, id) {
              return {
                  id: Number(id),
                  color: DEFAULT_EDGE_COLOR,
                  from: Number(from),
                  to: Number(to),
                  weight: Number(weight)
              }
          },
          
          setEdgeColor: function (ind, color) {
              this.edges[ind].color = color;
          }

      };
    };

    graph = Graph();

    canvas = document.getElementById('canvas');

    idRow = document.getElementById('tr_id');
    distancesRow = document.getElementById('tr_distances');
    prevVertexRow = document.getElementById('tr_prev_vertex');

    ctx = canvas.getContext('2d');

    // Canvas render
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
            ctx.fillStyle = startVertex !== undefined && node.id === startVertex.id ? START_VERTEX_COLOR : node.color;
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


    var getNodeById = function (id) {
        var result = undefined;
        graph.nodes.forEach(function (node) {
            if (node.id === id) {
                result = node;
            }
        });
        return result;
    };

    // Получает из события мыши координаты, относительно левого верхнего угла канвы.
    var getMousePosFromEvent = function (evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    // Находит узел, находящийся по заданой координате на канве.
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

    // При нажатии кнопки мыши находим узел по которому было нажатие,
    // запоминаем его в dragNode для дальнейшего использования,
    // в dragPoint запоминаем по какому месту узла была нажата кнопка мыши.
    canvas.addEventListener('mousedown', function (event) {
        if (!btnView.disabled) {
            return;
        }
        var pos = getMousePosFromEvent(event);
        dragNode = getNodeByPos(pos);
        if (dragNode !== undefined) {
            dragPoint = {
                x: pos.x - dragNode.x,
                y: pos.y - dragNode.y
            }
        }
    }, false);

    // При отпускании кпнопки мыши забываем текущий перетаскиваемый узел.
    canvas.addEventListener('mouseup', function () {
        dragNode = undefined;
    }, false);

    // При движении мыши, если есть перетаскиваемый узел, двигаем его и перерисовываем канву.
    canvas.addEventListener('mousemove', function (event) {
        var pos;
        if (dragNode !== undefined) {
            pos = getMousePosFromEvent(event);
            dragNode.x = pos.x - dragPoint.x;
            dragNode.y = pos.y - dragPoint.y;
            render();
        }
    }, false);

    canvas.addEventListener('click', function (event) {
        var pos = getMousePosFromEvent(event);
        switch (true) {
            case btnCreateVertex.disabled:
                createVertex(pos);
                break;
            case btnCreateEdge.disabled:
                createEdge(pos);
                break;
            case btnSelectStartVertex.disabled:
                selectStartVertex(pos);
                break;
            default:
                return;
        }
        render();
    }, false);

    var createVertex = function (pos) {
        var id = graph.nodes.length;
        var header = idRow.insertCell(id + 1);
        header.innerHTML = "<b>" + id.toString() + "</b>";
        distancesRow.insertCell(id + 1);
        prevVertexRow.insertCell(id + 1);

        graph.nodes.push(graph.createNode(pos, id));
    };

    
    var addEdgeToGraph = function (from, to, weight) {
        var edge1 = graph.createEdge(from, to, Number(weight), graph.edges.length),
            edge2 = graph.createEdge(to, from, Number(weight), graph.edges.length);
        graph.nodes[from].edges.push(edge1);
        graph.nodes[to].edges.push(edge2);
        graph.edges.push(edge1);
    };
    
    var createEdge = function (pos) {
        var node = getNodeByPos(pos);
        if(node === undefined) return;

        var prevColor = node.color;
        node.color = CURRENT_VERTEX_COLOR;

        if (firstSelectedNode === undefined) {
            firstSelectedNode = {
                node: node,
                prevColor: prevColor
            };
        } else {
            var weight = prompt("Enter edge's weight");

            if (weight) {
                var firstId = firstSelectedNode.node.id,
                    secondId = node.id;

                addEdgeToGraph(firstId, secondId, weight);
            }
            firstSelectedNode.node.color = firstSelectedNode.prevColor;
            node.color = prevColor;
            firstSelectedNode = undefined;
        }
    };

    var selectStartVertex = function (pos) {
        if(startVertex !== undefined) startVertex.color = DEFAULT_VERTEX_COLOR;
        startVertex = getNodeByPos(pos);
        if(startVertex === undefined) return;
        startVertex.color = START_VERTEX_COLOR;
        btnWork.disabled = false;
    };

    var createRandomGraph = function () {
        clearGraph();

        var vertexCount;
        while((vertexCount = prompt("Enter vertices count (Maximum is 10)")) > 10);
        if(!vertexCount) return;

        var verticesPos = [];

        var getRandomValue = function (limit) {
            return Math.floor(Math.random()*1000) % limit;
        };

        var compareCoordinateForCompatibility = function (pos1, pos2, withWhat) {
            return Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) > withWhat * withWhat;
        };
        var getRandomPos = function() {
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

        // Create adjacency matrix to trace for enable edges
        var adjacencyMatrix = new Array(vertexCount);
        for(var i = 0; i < vertexCount; i++){
            adjacencyMatrix[i] = new Array(vertexCount);
        }
        // Fill matrix all true without diagonal
        for(var i = 0; i < vertexCount; i++){
            for(var j = i; j < vertexCount; j++){
                if(i !== j && getRandomValue(2)){
                    addEdgeToGraph(i, j, getRandomValue(20));
                }
            }
        }

        render();
    };

    var distances,
        flags,
        edgesIdToPrevVertex;

    var recreateAlgorithmExtraInfo = function () {
        distances = [];
        flags = [];
        edgesIdToPrevVertex = [];
    };

    var INFINITY_CHAR = "&#8734";

    var setDistance = function(ind, num) {
        distancesRow.cells[ind + 1].innerHTML = num !== Number.MAX_VALUE ? num.toString() : INFINITY_CHAR;
        distances[ind] = Number(num);
    };

    var setPrevVertex = function(to, from) {
        prevVertexRow.cells[to + 1].innerHTML = from.toString();
    };

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
    }

    var nextStep,
        nextTimer,
        currentStep,
        isStopped = false,
        isPaused = false,
        isPauseOrStop,
        currentVertex,
        edges;

    nextStep = function (func, timeInSec) {
        if(isPauseOrStop(func)) return;
        nextTimer = setTimeout(func, timeInSec*1000*(1/speed));
    };

    isPauseOrStop = function (func) {
        currentStep = func;
        return isStopped || isPaused;
    };

    var startDijkstra = function() {
        clearAlgorithmInfo();
        sendInfo("Start algorithm...");
        nextStep(setFirstDistances, 1);
    };

    var setFirstDistances = function () {
        if(isPauseOrStop(setFirstDistances)) return;
        sendInfo("Set starting value of distances to all vertices<br>" +
            "For starting vertex the value is <b>0</b> to another vertices <b>INFINITY</b>");
        for(var i = 0; i < graph.nodes.length; i++){
            setDistance(i, Number.MAX_VALUE);
            edgesIdToPrevVertex[i] = undefined;
            flags[i] = false;
        }
        edgesIdToPrevVertex = new Array(graph.nodes.length);

        setDistance(startVertex.id, 0);
        setPrevVertex(startVertex.id, "-");

        nextStep(checkVerticesStep, 3);
    };
    
    var checkVerticesStep = function () {
        if(isPauseOrStop(checkVerticesStep)) return;
        currentVertex = getMinVertex();
        if(currentVertex === false) {
            sendInfo("All vertices is checked");
            nextStep(endDijkstra, 3);
            return;
        }
        sendInfo("Choosing the vertex with minimal distance...<br>" +
            "ID of vertex with minimal distance is: <b>" + currentVertex + "</b>");
        flags[currentVertex] = true;
        graph.setNodeColor(currentVertex, CURRENT_VERTEX_COLOR);

        edges = [];
        graph.getNode(currentVertex).edges.forEach(function(edge) {
            edges.push(graph.createEdge(edge.from, edge.to, edge.weight, edge.id));
        });

        sendInfo("Run for all edges from vertex <b>" + currentVertex + "</b>...");
        render();
        nextStep(checkEdgesStep, 3);
    };

    var checkEdgesStep = function() {
        if(isPauseOrStop(checkEdgesStep)) return;
        if(edges.length > 0) nextStep(checkEdgeStep, 2);
        else {
            sendInfo("All edges from this vertex is checked");
            graph.setNodeColor(currentVertex,(currentVertex !== startVertex.id)
                ? VISIT_VERTEX_COLOR : START_VERTEX_COLOR);
            nextStep(checkVerticesStep, 3);
        }
    };

    var checkEdgeStep = function () {
        if(isPauseOrStop(checkEdgeStep)) return;
        var edge = edges.pop();
        sendInfo("Edge from <b>" + edge.from + "</b> to <b>" + edge.to + "</b> with weight <b>" + edge.weight + "</b>");
        var newWeight = Number(distances[currentVertex]) + Number(edge.weight);
        if(newWeight < distances[edge.to]) {
            var message = "Distance from this edge less then previous edge <b>" + newWeight + " < ";
            message += distances[edge.to] !== Number.MAX_VALUE ? distances[edge.to].toString() : INFINITY_CHAR;
            sendInfo(message + "</b>");
            setDistance(edge.to, newWeight);
            setPrevVertex(edge.to, edge.from);
            if(edgesIdToPrevVertex[edge.to] !== undefined)
                graph.setEdgeColor(edgesIdToPrevVertex[edge.to], VISIT_VERTEX_COLOR);
            edgesIdToPrevVertex[edge.to] = edge.id;
            graph.setEdgeColor(edge.id, CURRENT_VERTEX_COLOR);
            render();
        }
        nextStep(checkEdgesStep, 3);
    };

    var endDijkstra = function () {
        if(isPauseOrStop(endDijkstra)) return;
        sendInfo("The algorithm is done working");
        render();
    };

    render();

};
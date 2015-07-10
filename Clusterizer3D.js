
var randomIntInRange = function (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

var randomInt = function () {
	return randomIntInRange(0, 1000);
};

var shuffle = function (array) {
	for (var i = array.length - 1; i > 0; --i) {
		var randIdx = randomIntInRange(0, i);
		var tmp = array[randIdx];
		array[randIdx] = array[i];
		array[i] = tmp;
	}
}

// mark - 

var Point3D = function (x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
};
Point3D.prototype.distanceToPoint = function (point3D) {
	var p = point3D;
	return Math.sqrt((this.x - p.x) * (this.x - p.x) + (this.y - p.y) * (this.y - p.y) + (this.z - p.z) * (this.z - p.z));
};

// mark - 

var Clusterizer3D = function () {

// heap

	var MinHeapNode = function (key, value) {
		this.key = key;
		this.value = value;
	};

	var MinHeap = function() {
		this.vector = [];

		var blank = new MinHeapNode(null, null);
		this.vector.push(blank);
	};
	MinHeap.prototype.percolateUp = function(index) {
		var node = this.vector[index];
		var hole = index;
		var parent = Math.floor(hole/2);
		while (hole > 1 && node.key < this.vector[parent].key) {
			this.vector[hole] = this.vector[parent];
			hole = parent;
			parent = Math.floor(hole/2);
		}
		this.vector[hole] = node;
	};
	MinHeap.prototype.percolateDown = function(index) {
		var length = this.vector.length;
		var node = this.vector[index];
		var hole = index;
		while (2*hole < length) {
			var child = 2*hole;
			if (child + 1 < length && this.vector[child + 1].key < this.vector[child].key) {
				++child;
			}

			if (node.key < this.vector[child].key) {
				break;
			} else {
				this.vector[hole] = this.vector[child];
				hole = child;
			}
		}
		this.vector[hole] = node;
	};
	MinHeap.prototype.empty = function() {
		return this.vector.length < 2;
	};
	MinHeap.prototype.push = function(key, value) {
		var node = new MinHeapNode(key, value);
		this.vector.push(node);
		this.percolateUp(this.vector.length - 1);
	};
	MinHeap.prototype.lookUpMin = function() {
		var length = this.vector.length;
		if (length < 2) {
			throw "The heap is empty!";
		} else {
			var node = this.vector[1];
			return {
				key: node.key,
				value: node.value
			};
		}
	};
	MinHeap.prototype.popMin = function() {
		var length = this.vector.length;
		if (length < 2) {
			throw "The heap is empty!";
		} else if (length < 3) {
			var node = this.vector[1];
			this.vector.pop();
			return {
				key: node.key,
				value: node.value
			};
		} else {
			var node = this.vector[1];
			this.vector[1] = this.vector[length - 1];
			this.vector.pop();
			this.percolateDown(1);
			return {
				key: node.key,
				value: node.value
			};
		}
	};

	Clusterizer3D.prototype.minHeapTest = function () {

		var minHeap = new MinHeap();
		for (var i = 0; i < 100; ++i) {
			var key = randomInt();
			var value = null;
			minHeap.push(key, value);
		}

		var previousMinKey = minHeap.lookUpMin().key;
		while (!minHeap.empty()) {
			var minKey = minHeap.popMin().key;
			if (minKey < previousMinKey) {
				throw "The heap is broken!";
				break;
			} else {
				console.log("Next min key: " + minKey);
				previousMinKey = minKey;
			}
		}
	};

// union find

	var UnionFindNode = function (value) {
		this.leaderIdx = -1;
		this.rank = 0;
		this.value = value;
	};

	var UnionFind = function (elements) {
		this.array = [];
		for (var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			element.unionIdx = i;

			var node = new UnionFindNode(element);
			node.leaderIdx = i;

			this.array.push(node);
		}
		this.clustersCount = this.array.length;
	};
	UnionFind.prototype.findLeader = function (unionIdx) {
		var nodeIdx = unionIdx;
		var node = this.array[nodeIdx];
		while (node.leaderIdx != nodeIdx) {
			nodeIdx = node.leaderIdx;
			node = this.array[nodeIdx];
		}
		var leaderIdx = nodeIdx;

		// compression 
		var nodeIdx = unionIdx;
		var node = this.array[nodeIdx];
		while (node.leaderIdx != nodeIdx) {
			nodeIdx = node.leaderIdx;
			node.leaderIdx = leaderIdx;
			node = this.array[nodeIdx];
		}
		return leaderIdx;
	}
	UnionFind.prototype.unite = function (unionIdx1, unionIdx2) {
		var leaderIdx1 = this.findLeader(unionIdx1);
		var leaderIdx2 = this.findLeader(unionIdx2);
		if (leaderIdx1 == leaderIdx2) {
			return false
		}
		
		var node1 = this.array[leaderIdx1];
		var node2 = this.array[leaderIdx2];
		if (node1.rank < node2.rank) {
			node1.leaderIdx = leaderIdx2;
		} else {
			node2.leaderIdx = leaderIdx1;
			++node1.rank;
		}
		--this.clustersCount;
		return true;
	};

// graph

	var Vertex = function (value) {
		this.edges = [];
		this.value = value;
	};

	// tail * ---------> * head
	var Edge = function (tail, head, cost) {
		this.tail = tail;
		this.head = head;
		this.cost = cost;
	};

	var Graph = function () {
		this.verticies = [];
		this.edges = [];
	};
	Graph.prototype.build = function (points3D) {
		for (var i = 0; i < points3D.length; ++i) { 
			this.verticies.push(new Vertex(points3D[i]));
		}		
		for (var i = 0; i < this.verticies.length; ++i) {
			for (var j = i + 1; j < this.verticies.length; ++j) {
				var v1 = this.verticies[i];
				var v2 = this.verticies[j];

				var p1 = v1.value;
				var p2 = v2.value;

				var distance = p1.distanceToPoint(p2);
				var edge = new Edge(v1, v2, distance);

				this.edges.push(edge);
				v1.edges.push(edge);
				v2.edges.push(edge);
			}
		}
	};

// clusterization algorithm (Kruskal's minimum spanning tree based)

	Clusterizer3D.prototype.clusterize = function (K, points3D) {
		var graph = new Graph();
		graph.build(points3D);

		var minHeap = new MinHeap();
		for (var i = 0; i < graph.edges.length; ++i) {
			var edge = graph.edges[i];
			var key = edge.cost;
			var value = edge;
			minHeap.push(key, value);
		}

		var unionFind = new UnionFind(graph.verticies);

		while (!minHeap.empty()) {
			var minCostEdge = minHeap.popMin().value;
			var tail = minCostEdge.tail;
			var head = minCostEdge.head;

			unionFind.unite(tail.unionIdx, head.unionIdx);
			if (K >= unionFind.clustersCount) {
				break;
			}
		}

		var clustersMap = {};
		var clusters = [];
		for (var i = 0; i < unionFind.array.length; ++i) {
			var node = unionFind.array[i];
			var vertex = node.value;
			var leaderIdx = unionFind.findLeader(vertex.unionIdx);

			if (clustersMap[leaderIdx] === undefined) {
				clustersMap[leaderIdx] = clusters.length;
				clusters.push([]);
			}
			var clusterIndex = clustersMap[leaderIdx];
			clusters[clusterIndex].push(vertex.value);
		}
		return clusters;
	};
};

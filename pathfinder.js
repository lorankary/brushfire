'use strict'

// wait for the window to load and than call back setup()
window.addEventListener('load', setup, false);
var count = 0;
var cellId = 0;
var pf;   // the global path finder object
const TWO_PI = 6.28318530718;
const FRAME_RATE=10;

function setup() {
  pf = new PathFinder();
  window.setTimeout(draw, 100);    // wait 100ms for resources to load then start draw loop
}

function draw() {   // the animation loop
  pf.run();
  window.setTimeout(draw, 1000/FRAME_RATE);  // come back here every interval
}


class PathFinder{

  constructor(){
    // get and validate canvas and context
    this.canvas = document.getElementById('canvas');
    if (!this.canvas || !this.canvas.getContext)
    throw "No valid canvas found!";
    this.context = this.canvas.getContext("2d");
    if(!this.context)
    throw "No valid context found!";
    // pf properties

    this.isRunning = true;
    this.mouseX = 0;
    this.mouseY = 0;
    this.w = 70;
    this.done = false;
    // containerarrays for cells
    this.grid = [];
    this.queue = [];
    this.empty = [];         // whole grid
    this.root = null;
    this.empty.push(this.root);
    this.current;

    this.cols = Math.floor(this.canvas.width / this.w);
    this.rows = Math.floor(this.canvas.height / this.w);

    // init class methods
    this.init();

  }

  init(){
    this.loadGrid();
    this.brushfire();
    //  add listeners
    // Every time the use clicks in a cell that cell becomes blocked
    // or unblocked and all the distances and parents need to
    // be determined again.
    this.canvas.addEventListener('mousedown',function(evt){
      pf.mouseX = evt.offsetX;
      pf.mouseY = evt.offsetY;
      let row = Math.floor(pf.mouseY/pf.w);
      let col = Math.floor(pf.mouseX/pf.w);
      // toggle the occupied property of the clicked cell
      pf.grid[col][row].occupied = !pf.grid[col][row].occupied;
      pf.brushfire();   // all new distances and parents
    }, false );

    this.canvas.addEventListener('mousemove',function(evt){
      pf.mouseX = evt.offsetX;
      pf.mouseY = evt.offsetY;
    }, false );
  }//  ++++++++++++++++++++++++++++++++++++++++++++  End init
  

    // brushfire()
    // starting with the 'root' cell, which is the bottom right cell of the grid
    // assign a "distance" to all other cells where the distance is the
    // accumulated steps from that cell to the root cell.
    // An adjacent neighbor has a distance of 10
    // and a diagonal neighbor has a distance of 14.
    
  brushfire() {
    // Initialize each cell in the grid to have a distance that
    // is the greatest possible.  Initialize each cell to 
    // have no parent and populate it's array of neighbors
    for(var i = 0; i < this.cols; i++){
      for(var j = 0; j < this.rows; j++){
        var cell = this.grid[i][j];
        cell.dist = this.cols * this.rows * 10;     // set distance to max
        cell.vec = null;    // clear parent vector
        cell.parent = 0;    // clear parent
        cell.addNeighbors(this,  this.grid); // fill the neighbors array
      }
    }
    // Initialize the fifo queue with the root cell
    this.root = this.grid[this.cols - 1][this.rows -1];
    this.root.dist = 0;
    this.root.color = "red";
    this.queue = [this.root];

    // loop as long as the queue is not empty, removing the first cell
    // in the queue and adding all its neighbors to the end of the
    // queue.  The neighbors will only be those that are not occupied
    // and not blocked diagonally.  
    while(this.queue.length) {    
        var current = this.queue.shift();   // remove the first cell from the queue
        // for all its neighbors...
        for(let j =0; j < current.neighbors.length; j++){
            let neighbor = current.neighbors[j];
            var dist = current.dist+10; // adjacent neighbors have a distance of 10
            if(current.loc.x != neighbor.loc.x && current.loc.y != neighbor.loc.y)
                dist = current.dist+14; // diagonal neighbors have a distance of 14
            // if this neighbor has not already been assigned a distance
            // or we now have a shorter distance, give it a distance
            // and a parent and push to the end of the queue.
            if(neighbor.dist > dist) {
                neighbor.parent = current;
                neighbor.dist = dist;
                this.queue.push(neighbor);
                }
          }     // for each neighbor
        }   // while(this.queue.length)
        
        // give each cell a vector that points to its parent
      for(var i = 0; i < this.cols; i++){
        for(var j = 0; j < this.rows; j++){
          this.grid[i][j].vec = this.grid[i][j].getVector();
        }
      }
  
    }
    

  run(){
    this.render();
    
  }//  End run++++++++++++++++++++++++++++++++++++++++++++++++++++

  render(){
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // render entire grid
    for(let i = 0; i < this.cols; i++){
      for(let j = 0; j < this.rows; j++){
        this.grid[i][j].render();
      }//loop
    }// loop
 

  } //  ++++++++++++++++++++++++++++++++++++++++  End Render
  // +++++++++++++++++++++++++++++++++++++++++++  load a 2D array with cells
  loadGrid(){
    for(var i = 0; i < this.cols; i++){
      this.grid[i] = [];
      for(var j = 0; j < this.rows; j++){
        this.grid[i][j] = new Cell(this, vector2d((i*this.w), (j*this.w)), ++cellId);
        // make 10% of the cells occupied
        if(Math.floor(Math.random()*100) < 10)   
            this.grid[i][j].occupied = true;
      }
    }

  }  // ++++++++++++++++++++++++++++++++++++++++++++++  End LoadGrid


}/// pathfinder

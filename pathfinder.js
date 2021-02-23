'use strict'

// wait for the window to load and than call back setup()
window.addEventListener('load', setup, false);
var count = 0;
var cellId = 0;
var pf;   // the global path finder object
const TWO_PI = 6.28318530718;
const FRAME_RATE=10;
var run = false;
var step = false;

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

    this.layout = {
        grid: { top: 10, left: 10, width: 720, height: 600},
        current: {top: 640, left: 20, width: 60, height: 60},
        queue: { top: 640, left: 100, width: 600, height: 60}
    }

    this.isRunning = true;
    this.mouseX = 0;
    this.mouseY = 0;
    this.w = 60;
    this.done = false;
    // containerarrays for cells
    this.grid = [];
    this.enemies = [];

    // this.cols = Math.floor(this.canvas.width / this.w);
    // this.rows = Math.floor(this.canvas.height / this.w);
    this.cols = 12;
    this.rows = 10;
    this.maxDist = this.cols * this.rows * 10;
    this.loadGrid();
    this.root = this.grid[this.cols - 1][this.rows -1];
    this.brushfire();
    //  add listeners
    // Every time the use clicks in a cell that cell becomes blocked
    // or unblocked and all the distances and parents need to
    // be determined again.
    this.canvas.addEventListener('mousedown',function(evt){
      pf.mouseX = evt.offsetX;
      pf.mouseY = evt.offsetY;
      let row = Math.floor((pf.mouseY-pf.layout.grid.top)/pf.w);
      let col = Math.floor((pf.mouseX-pf.layout.grid.left)/pf.w);
      if(row >= 0 && row < pf.rows && col >= 0 && col < pf.cols){
          // toggle the occupied property of the clicked cell
          pf.grid[col][row].occupied = !pf.grid[col][row].occupied;
          pf.brushfire();   // all new distances and parents
          // delete any enemy that is currently in a cell without a parent
          for(let i = 0; i < pf.enemies.length;  i++) {
            let enemy = pf.enemies[i];
            if(!enemy.currentCell.parent)
                enemy.kill = true;    // kill the orphans
            }
        }
    }, false );

    this.canvas.addEventListener('mousemove',function(evt){
      pf.mouseX = evt.offsetX;
      pf.mouseY = evt.offsetY;
    }, false );

    window.addEventListener("keypress", function(e){
        switch(e.code){
            case "KeyR":
                run = !run;
                break;
            case "KeyS":
                run = false;
                step = true;
                break;
            break;
        }
    }, false);
  }

    // brushfire()
    // starting with the 'root' cell, which is the bottom right cell of the grid
    // assign a "distance" to all other cells where the distance is the
    // accumulated steps from that cell to the root cell.
    // An adjacent neighbor has a step of 10
    // and a diagonal neighbor has a step of 14.

  brushfire() {
    // Initialize each cell in the grid to have a distance that
    // is the greatest possible.  Initialize each cell to
    // have no parent and populate it's array of neighbors
    for(var i = 0; i < this.cols; i++){
      for(var j = 0; j < this.rows; j++){
        var cell = this.grid[i][j];
        cell.dist = this.maxDist;     // set distance to max
        cell.vec = null;    // clear parent vector
        cell.parent = 0;    // clear parent
        cell.addNeighbors(this,  this.grid); // fill the neighbors array
      }
    }
    // Initialize the fifo queue with the root cell
    this.root.dist = 0;
    this.root.occupied = false;
    this.queue = [this.root];
}

    // loop as long as the queue is not empty, removing the first cell
    // in the queue and adding all its neighbors to the end of the
    // queue.  The neighbors will only be those that are not occupied
    // and not blocked diagonally.
    // while(queue.length) {
    //
    //
    //     // give each cell a vector that points to its parent
    //   for(var i = 0; i < this.cols; i++){
    //     for(var j = 0; j < this.rows; j++){
    //       this.grid[i][j].vec = this.grid[i][j].getVector();
    //     }
    //   }
    //
    // }

    // sendEnemies()
    // Send a random number of enemies, up to 5, each from a random location
    // in the top half of the grid.  About half of the enemies will take the
    // optimal path simply by following the parent chain and about half will
    // take a path of randomly choosing cells to be next on the path
    // from all those cells with a distance to the root that is
    // less than its current location.
    // A valid cell to start the enemy must have a parent because lack
    // of a parent means either it is occupied or it is blocked from any path.
    sendEnemies() {
        var numEnemies = Math.random() * 5;     // up to 5 enemies
        var row, col, startCell, i, j;
        for( i = 0; i < numEnemies; i++) {
            for(j = 0; j < 3; j++) { // try 3 times to find valid start cell
                let row = Math.floor(Math.random() * (pf.rows/2));    // top  half of rows
                let col = Math.floor(Math.random() * pf.cols);        // any column
                startCell = pf.grid[col][row];
                if(startCell && startCell.parent)   // must have a parent to have any path
                    break;
                }
            if(j < 3) { // if we found a valid cell to start the enemy
                let randomPath = Math.floor(Math.random() * 2);    // about half
                pf.enemies.push(new Enemy(pf, startCell, randomPath));
                }
            }
    }


  run(){
      if(run || step) {
        if(step) step = false;
        if(this.queue.length){
            let current = this.current = this.queue.shift();   // remove the first cell from the queue
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
                    neighbor.vec = neighbor.getVector();   // vector to parent
                    neighbor.dist = dist;
                    this.queue.push(neighbor);
                    }
              }     // for each neighbor
            }   // while(queue.length)
        else this.current = null;
    }
    this.render();
    for(let i = this.enemies.length-1; i >= 0; i--) {
        if(this.enemies[i].kill)
            this.enemies.splice(i,1);   // delete this dead enemy
        else this.enemies[i].run();
        }

  }//  End run++++++++++++++++++++++++++++++++++++++++++++++++++++

  render(){
      let ctx = this.context;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // render entire grid
    for(let i = 0; i < this.cols; i++){
      for(let j = 0; j < this.rows; j++){
        this.grid[i][j].render();
      }//loop
    }// loop

    // render the current cell if any
    ctx.strokeStyle = "black";
    let cur = this.layout.current;
    if(this.current){
        ctx.fillStyle = "green";
        ctx.fillRect(cur.left, cur.top, cur.width, cur.height);
        this.current.getText(vector2d(cur.left, cur.top));
    }
    ctx.strokeRect(cur.left, cur.top, cur.width, cur.height);

    // render the queue
    let queue = this.layout.queue;
    // how many cells can be displayed in the queue
    let numQs = queue.width/this.w;
    for(let i = 0; i < this.queue.length; i++){
        if(i == numQs)
            break;  // only display the first numQs cells
        ctx.fillStyle = "LightGreen";
        let qLoc_x = queue.left+(i*this.w);
        let qLoc_y = queue.top;
        ctx.fillRect(qLoc_x,qLoc_y,this.w,this.w);
        this.queue[i].getText(vector2d(qLoc_x,qLoc_y));
    }
    ctx.strokeRect(queue.left, queue.top, queue.width, queue.height);


  } //  ++++++++++++++++++++++++++++++++++++++++  End Render
  // +++++++++++++++++++++++++++++++++++++++++++  load a 2D array with cells
  loadGrid(){
    for(var i = 0; i < this.cols; i++){
      this.grid[i] = [];
      for(var j = 0; j < this.rows; j++){
        this.grid[i][j] = new Cell(this, i, j, ++cellId);
        // make 10% of the cells occupied
        if(this.grid[i][j] != this.root && Math.floor(Math.random()*100) < 10)
            this.grid[i][j].occupied = true;
      }
    }

  }  // ++++++++++++++++++++++++++++++++++++++++++++++  End LoadGrid

  handleButtonMouseOver() {
    this.style.backgroundColor = '#AA3377';
  }

  handleButtonMouseOut() {
    this.style.backgroundColor = '#AAA';
  }



}/// pathfinder

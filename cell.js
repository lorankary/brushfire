
class Cell{
  constructor( pf, loc, id){
    this.pf = pf;       // the global instance
    this.loc = loc;     // top left pixel location
    this.center = vector2d(loc.x+(pf.w)/2, loc.y+(pf.w)/2);
    this.color = 'pink';
    this.id = id;
    this.neighbors = [];
    this.occupied = false;
    this.parent = 0;  //  this is the parent cell
    this.dist = -1; 
    this.vec = null;

  }

  render(){
    let pf = this.pf;
    pf.context.strokeStyle = 'white';
    pf.context.strokeRect(this.loc.x, this.loc.y, pf.w, pf.w);
    if(this.occupied) 
        this.color = "darkSlateGray";
    else this.color = 'pink';
    pf.context.fillStyle = this.color;
    pf.context.fillRect(this.loc.x, this.loc.y, pf.w, pf.w);

    // draw vector
    if(this.vec && !this.occupied){
      pf.context.beginPath();
      pf.context.moveTo(this.center.x, this.center.y);
      pf.context.lineTo(this.center.x + this.vec.x, this.center.y + this.vec.y);
      pf.context.stroke();

    }
           
    this.getText();
  }

    // addNeighbors()
    // Find all the neighbors of this cell that exist and are not occupied.
    // Diagonal neighbors must not be blocked diagonally.
    // For example, a southeast neighbor might not be occupied
    // but if east and south are both occupied then southeast is blocked
    // and not considered to be a neighbor.
    
  addNeighbors(pf, grid){
    this.neighbors = [];    // start with empty neighbors
    let col = this.loc.x/pf.w;
    let row = this.loc.y/pf.w;
    let n,ne,e,se,s,sw,w,nw = null; // all eight neighbors

    if(row > 0 ){
          n = grid[col][row-1];
          if(!n.occupied)
            this.neighbors.push(n);    //N
        }
    if( col < pf.cols-1){
        e = grid[col+1][row];
        if(!e.occupied)
        this.neighbors.push(e);    //E
    }
    if(row < pf.rows-1){
        s = grid[col][row+1];
        if(!s.occupied)
            this.neighbors.push(s);    //S
    }
     if(col > 0){
        w = grid[col-1][row];
        if(!w.occupied)
            this.neighbors.push(w);    //W
    }
    if( col < pf.cols-1 &&  row > 0){           //  NE
        ne = grid[col+1][row-1];
        if(!ne.occupied && !(n && n.occupied && e && e.occupied)){
            this.neighbors.push(ne);
            }
    }
     if(col < pf.cols-1 &&  row < pf.rows-1){      //  SE
        se = grid[col+1][row+1];
        if(!se.occupied && !(e && e.occupied && s && s.occupied)){
            this.neighbors.push(se);
            }
    }
    if(col > 0 &&  row < pf.rows-1 ){             //  SW
        sw = grid[col-1][row+1];
        if(!sw.occupied && !(s && s.occupied && w && w.occupied)){
            this.neighbors.push(sw);
            }
    }
    if(col > 0 && row > 0){                     //  NW
        nw = grid[col-1][row-1];
        if(!nw.occupied && !(w && w.occupied && n && n.occupied)){
            this.neighbors.push(nw);
            }
        }
  }

    // Return a vector from this cell to its parent
  getVector(){
    if(this.parent) {
        let dx = this.parent.loc.x - this.loc.x;
        let dy = this.parent.loc.y - this.loc.y;
        let v = new vector2d(dx, dy);
        return v;
        }
    else return(vector2d(0,0));
  }

  getText(){

    var context = pf.context;
    context.save();
    context.fillStyle = "white";
    context.font = "14px sans-serif";
    context.fillText(""+this.dist, this.loc.x+.2*pf.w/2, this.loc.y+pf.w/2 - 5);
    context.fillStyle = "black";
    context.fillText(""+this.id, this.loc.x+.2*pf.w/2, this.loc.y+pf.w/2 +15);
    //if(this.vec) context.fillText(""+this.vec.toString(), this.loc.x+.2*pf.w/2, this.loc.y+pf.w/2 +15);

    context.restore();
  }



}

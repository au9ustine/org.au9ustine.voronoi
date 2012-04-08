function Point(a,b){
    this.x = (a)?a:0;
    this.y = (b)?b:0;
}


var d = [], q = [];


d.push(1,2,new Point(),new Point(1,2));
q.push(2);


console.log(d.length,d);
console.log(q.length,q);


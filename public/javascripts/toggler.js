$(function(){
    var voronoi_toggled = false;
    $("a[rel=popover]")
        .popover({
            offset:10
        })
        .click(function(e){
            var btn = $(this);
            var eventsCache = v_demo.eventsCache;
            var canvas = document.getElementById('voronoi_canvas');
            if(voronoi_toggled){
                btn.button('reset');
                voronoi_toggled = false;
                canvas.onkeydown = eventsCache.pop();
                window.addEventListener('keydown',canvas.onkeydown,true);
                canvas.onclick = eventsCache.pop();
                canvas.onmousemove = eventsCache.pop();
            } else {
                btn.button('complete');
                voronoi_toggled = true;
                eventsCache.push(canvas.onmousemove);
                canvas.onmousemove = undefined;
                eventsCache.push(canvas.onclick);
                canvas.onclick = undefined;
                eventsCache.push(canvas.onkeydown);
                window.removeEventListener('keydown',canvas.onkeydown,true);
                canvas.onkeydown = undefined;
            }
        })
});
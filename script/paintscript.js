      var canvas = document.getElementById("mycanvas");
      var tmp_canvas = document.getElementById("mytmpcanvas");
      can_width = canvas.width;
      can_height = canvas.height;
      var ctx = canvas.getContext("2d");
      var tmp_ctx = tmp_canvas.getContext("2d");
      var x,y;
      var mouse_hold = false;
      var fill = false;
      var saved=false;
      var stroke = true;
      var tool = 'pencil';
      var color='#000000';
      var thick=1;
      cvs_data = {"line": [], "pencil": [], "box": [], "circle": [], "eraser": [] };
      function curr_tool(selected){tool = selected;}
      
	  function draw_type(){
        if (document.getElementById("fill").checked)
          fill = true;
        else
          fill = false;
        if (document.getElementById("line").checked)
          stroke = true;
        else
          stroke = false;
      }
	  
      function thickness(){
        thick=tmp_ctx.lineWidth = document.getElementById("thick").value;
      }
	  
      function clears(){
        ctx.clearRect(0, 0, can_width, can_height);
        tmp_ctx.clearRect(0, 0, can_width, can_height);
        cvs_data = {"line": [], "pencil": [], "box": [], "circle": [], "eraser": [] };
      }
	  
      function current_color(selected_color){
        color=selected_color;
      }
	  
      tmp_canvas.onmousedown = function(e) {
        draw_type();
        x = e.pageX - this.offsetLeft;
        y = e.pageY -this.offsetTop;
        mouse_hold = true;
        begin_x = x;
        begin_y = y;
        tmp_ctx.beginPath();
        tmp_ctx.moveTo(begin_x, begin_y);    
      }

      tmp_canvas.onmousemove = function(e) {
        if (x == null || y == null) {
          return;
        }
        if(mouse_hold){
          inter_x=x;
          inter_y=y;
          x = e.pageX - this.offsetLeft;
          y = e.pageY - this.offsetTop;
          paint();
        }
      }
     
      tmp_canvas.onmouseup = function(e) {
        ctx.drawImage(tmp_canvas,0, 0);
        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
        end_x = x;
        end_y = y;
        paint();
        x = null;
        y = null;
        mouse_hold = false;
      }
  
      function paint(){
        switch(tool){
          case 'pencil':
		tmp_ctx.lineTo(x, y);
	        tmp_ctx.strokeStyle=color;
            tmp_ctx.stroke();
            cvs_data.pencil.push({"x": inter_x, "y": inter_y, "end_x": x, "end_y": y,
                           "thick": tmp_ctx.lineWidth, "color": tmp_ctx.strokeStyle });
		    break;
	      case 'line':
		    tmp_ctx.clearRect(0, 0, can_width, can_height);
            tmp_ctx.beginPath();
            tmp_ctx.moveTo(begin_x, begin_y);
            tmp_ctx.lineTo(x, y);
            tmp_ctx.strokeStyle=color;
	        tmp_ctx.stroke();
            tmp_ctx.closePath();
            cvs_data.line.push({"x": begin_x, "y": begin_y, "end_x": end_x, "end_y": end_y,
                            "thick": tmp_ctx.lineWidth, "color": tmp_ctx.strokeStyle });
		    break;
	      case 'box':
		    tmp_ctx.clearRect(0, 0, can_width, can_height);
            if(stroke){
	          tmp_ctx.strokeStyle=color;
              tmp_ctx.strokeRect(begin_x, begin_y, x-begin_x, y-begin_y);
	        }
            if(fill){
	          tmp_ctx.fillStyle=color;
              tmp_ctx.fillRect(begin_x, begin_y, x-begin_x, y-begin_y);
	        }
            cvs_data.box.push({"x": begin_x, "y": begin_y, "width": end_x-begin_x, "height": end_y-begin_y,
                                 "thick": tmp_ctx.lineWidth, "stroke": stroke, "strk_clr": tmp_ctx.strokeStyle, 
                                 "fill": fill, "fill_clr": tmp_ctx.fillStyle });
            end_x=end_y=undefined;
		    break;
	      case 'circle': 
		    tmp_ctx.clearRect(0, 0, can_width, can_height);
            tmp_ctx.beginPath();
            tmp_ctx.arc(begin_x, begin_y, Math.abs(y - begin_y), 0 ,2*Math.PI, false);
            if(stroke){
	          tmp_ctx.strokeStyle=color; 
              tmp_ctx.stroke();
            }
            if(fill){
	          tmp_ctx.fillStyle=color; 
              tmp_ctx.fill();
	        }
            cvs_data.circle.push({"x": begin_x, "y": begin_y, "radius": Math.abs(end_y-begin_y), 
                              "thick": tmp_ctx.lineWidth, "stroke": stroke, "strk_clr": tmp_ctx.strokeStyle,
                              "fill": fill, "fill_clr": tmp_ctx.fillStyle });
            end_x=end_y=undefined;
		    break;
	      case 'eraser':
		    ctx.clearRect(x,y,thick,thick);
                    tmp_ctx.clearRect(x,y,thick,thick);
                    cvs_data.eraser.push({"er_x":x,"er_y":y,"thick":tmp_ctx.lineWidth});
		    break;
          default:
		    return;
	    }
      }
      function save(){
    var f_name =  document.getElementById("fname").value;
    if(!f_name){
      alert("Enter a Filename to save!");
      return;
    }
    var exist = is_there(f_name);
    if(!saved && exist){
      alert("Filename already exists!");
      return;
    } 
    $.post("/",{fname: f_name, whole_data: JSON.stringify(cvs_data)}); 
    title = f_name;
    alert("Saved!");
  }

  $(".paint_files").click(function(){ 
    var img_fname = $(this).text();
    document.getElementById("fname").value = img_fname;
    clears();
    iter_py_data(img_fname);
  });

  function iter_py_data(img_name){
    saved = true;
    for(var key in py_data){
      if(key == img_name){
        file_data = JSON.parse(py_data[key]);
        for(var ptool in file_data){
          if(file_data[ptool].length != 0){
            for(var i=0; i<file_data[ptool].length; i++){
              cvs_data[ptool].push(file_data[ptool][i]);
              shape_draw(ptool, file_data[ptool][i]);
            }
          }
         }
       }
     }
  }
   
  function shape_draw(ctool, shape){
    switch(ctool){
    case 'pencil':
      var bg_x = shape.x, bg_y = shape.y, x = shape.end_x, y = shape.end_y;
      ctx.lineWidth = shape.thick;
      ctx.strokeStyle = shape.color;
      ctx.beginPath();
      ctx.moveTo(bg_x, bg_y);
      ctx.lineTo(x, y);
      ctx.stroke();
      break;
    case 'line':
      ctx.beginPath();
        var l_x = shape.x;
        var l_y = shape.y;
        var lend_x = shape.end_x;
        var lend_y = shape.end_y;
        ctx.lineWidth = shape.thick;
        ctx.strokeStyle = shape.color;
        ctx.moveTo(l_x, l_y);
        ctx.lineTo(lend_x, lend_y);
        ctx.stroke();
        ctx.closePath();
        break;
    case 'box':
      var r_x = shape.x, r_y = shape.y, width = shape.width, height = shape.height, stroke = shape.stroke, fill = shape.fill;   
      ctx.beginPath();
      ctx.lineWidth = shape.thick;
      if(stroke){
        ctx.strokeStyle = shape.strk_clr;
        ctx.strokeRect(r_x, r_y, width, height);
      }
      if(fill){
        ctx.fillStyle = shape.fill_clr; 
        ctx.fillRect(r_x, r_y, width, height);
      }
      ctx.closePath();  
      break;
    case 'circle':   
      var c_x = shape.x, c_y = shape.y, width = shape.radius, stroke = shape.stroke, fill = shape.fill;
      ctx.beginPath();
      ctx.lineWidth = shape.thick;
      ctx.arc(c_x, c_y,width, 0 , 2 * Math.PI, false);
      if(stroke){
        ctx.strokeStyle = shape.strk_clr; 
        ctx.stroke();
      }
      if(fill){
        ctx.fillStyle = shape.fill_clr; 
        ctx.fill();
      }
      ctx.closePath();  
      break;
    case 'eraser':
      var e_x=shape.er_x,e_y=shape.er_y;
      ctx.clearRect(e_x,e_y,shape.thick,shape.thick);
      break;
    default:
      return;
   }
  }

  function is_there(fname){
    for(var each in py_data){
      if(each == fname) 
        return true;
    }
    return false;
  }

